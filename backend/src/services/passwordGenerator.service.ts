import crypto from 'crypto';
import { PasswordAnalyzerService, PasswordAnalysisResult } from './passwordAnalyzer.service';

export interface GeneratorOptions {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  special?: boolean;
}

export interface GeneratedPasswordResult {
  password: string;
  analysis: PasswordAnalysisResult;
}

export class PasswordGeneratorService {
  private static readonly UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
  private static readonly NUMBERS = '0123456789';
  private static readonly SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  public static generate(options: GeneratorOptions = {}): GeneratedPasswordResult {
    const length = Math.min(64, Math.max(12, options.length || 16));
    const useUpper = options.uppercase !== false;
    const useLower = options.lowercase !== false;
    const useNumbers = options.numbers !== false;
    const useSpecial = options.special !== false;

    let availableChars = '';
    const guaranteedChars: string[] = [];

    if (useUpper) {
      availableChars += this.UPPERCASE;
      guaranteedChars.push(this.getRandomChar(this.UPPERCASE));
    }
    if (useLower) {
      availableChars += this.LOWERCASE;
      guaranteedChars.push(this.getRandomChar(this.LOWERCASE));
    }
    if (useNumbers) {
      availableChars += this.NUMBERS;
      guaranteedChars.push(this.getRandomChar(this.NUMBERS));
    }
    if (useSpecial) {
      availableChars += this.SPECIAL;
      guaranteedChars.push(this.getRandomChar(this.SPECIAL));
    }

    if (availableChars.length === 0) {
      // Fallback if user unchecks everything
      availableChars = this.LOWERCASE + this.NUMBERS;
      guaranteedChars.push(this.getRandomChar(availableChars));
    }

    // Fill the rest of the password
    const passwordChars = [...guaranteedChars];
    while (passwordChars.length < length) {
      passwordChars.push(this.getRandomChar(availableChars));
    }

    // Fisher-Yates cryptographically secure shuffle
    for (let i = passwordChars.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
    }

    const password = passwordChars.join('');
    const analysis = PasswordAnalyzerService.analyze(password);

    return {
      password,
      analysis,
    };
  }

  private static getRandomChar(pool: string): string {
    const index = crypto.randomInt(0, pool.length);
    return pool[index];
  }
}
