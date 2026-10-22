export interface PasswordAnalysisResult {
  score: number; // 0 to 100
  strength: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  entropy: number; // bits of entropy
  length: number;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSpecial: boolean;
  hasCommonPattern: boolean;
  hasRepeatedChars: boolean;
  warnings: string[];
  suggestions: string[];
  criteria: {
    length12Plus: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    special: boolean;
    noObviousPattern: boolean;
  };
}

export class PasswordAnalyzerService {
  private static readonly COMMON_SEQUENCES = [
    '123456', '12345678', '123456789', 'password', 'qwerty', 'admin',
    'welcome', 'iloveyou', 'abc123', 'pass123', 'monkey', 'dragon',
    'football', 'master', 'letmein', 'access', 'secure', 'vault'
  ];

  public static analyze(password: string): PasswordAnalysisResult {
    const length = password.length;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    // Repeated characters: 3 or more consecutive identical characters (e.g., 'aaa', '111')
    const hasRepeatedChars = /(.)\1{2,}/i.test(password);

    // Common sequential patterns or popular words
    const lower = password.toLowerCase();
    const hasCommonPattern = this.COMMON_SEQUENCES.some((seq) => lower.includes(seq)) ||
      /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(lower) ||
      /(?:012|123|234|345|456|567|678|789|890)/.test(lower) ||
      /(?:qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm)/i.test(lower);

    // Calculate Pool Size R
    let poolSize = 0;
    if (hasLowercase) poolSize += 26;
    if (hasUppercase) poolSize += 26;
    if (hasNumbers) poolSize += 10;
    if (hasSpecial) poolSize += 33;

    // Shannon Entropy: E = L * log2(R)
    let entropy = 0;
    if (poolSize > 0 && length > 0) {
      entropy = Math.round(length * (Math.log2(poolSize)) * 10) / 10;
    }

    // Scoring system: base on length, variety, penalties
    let score = 0;
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (length === 0) {
      return {
        score: 0,
        strength: 'Very Weak',
        entropy: 0,
        length: 0,
        hasUppercase: false,
        hasLowercase: false,
        hasNumbers: false,
        hasSpecial: false,
        hasCommonPattern: false,
        hasRepeatedChars: false,
        warnings: ['Password cannot be empty'],
        suggestions: ['Enter at least 12 characters combining letters, numbers, and symbols.'],
        criteria: {
          length12Plus: false,
          uppercase: false,
          lowercase: false,
          numbers: false,
          special: false,
          noObviousPattern: false,
        },
      };
    }

    // Points for length
    if (length >= 16) score += 35;
    else if (length >= 12) score += 25;
    else if (length >= 8) score += 15;
    else score += 5;

    // Points for character diversity
    let diversityCount = 0;
    if (hasLowercase) { score += 10; diversityCount++; }
    if (hasUppercase) { score += 15; diversityCount++; }
    if (hasNumbers) { score += 15; diversityCount++; }
    if (hasSpecial) { score += 25; diversityCount++; }

    // Bonus for high entropy
    if (entropy >= 80) score += 10;
    else if (entropy >= 60) score += 5;

    // Penalties
    if (hasRepeatedChars) {
      score -= 15;
      warnings.push('Contains 3+ repeated identical characters.');
      suggestions.push('Avoid repeating identical characters consecutively.');
    }

    if (hasCommonPattern) {
      score -= 20;
      warnings.push('Contains a common dictionary word or predictable keyboard sequence.');
      suggestions.push('Avoid sequences like "123", "abc", or common words.');
    }

    if (length < 12) {
      warnings.push('Password length is under 12 characters.');
      suggestions.push('Increase length to 12 or more characters for greater resistance to brute-force.');
    }

    if (diversityCount < 3) {
      suggestions.push('Mix uppercase letters, lowercase letters, numbers, and special symbols.');
    }

    // Normalize score to 0 - 100
    score = Math.max(0, Math.min(100, score));

    // Categorize
    let strength: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
    if (score < 25) strength = 'Very Weak';
    else if (score < 50) strength = 'Weak';
    else if (score < 70) strength = 'Medium';
    else if (score < 85) strength = 'Strong';
    else strength = 'Very Strong';

    return {
      score,
      strength,
      entropy,
      length,
      hasUppercase,
      hasLowercase,
      hasNumbers,
      hasSpecial,
      hasCommonPattern,
      hasRepeatedChars,
      warnings,
      suggestions,
      criteria: {
        length12Plus: length >= 12,
        uppercase: hasUppercase,
        lowercase: hasLowercase,
        numbers: hasNumbers,
        special: hasSpecial,
        noObviousPattern: !hasCommonPattern && !hasRepeatedChars,
      },
    };
  }
}
