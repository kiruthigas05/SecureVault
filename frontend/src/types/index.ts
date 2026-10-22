export interface User {
  id: string;
  name: string;
  email: string;
  mfaEnabled: boolean;
  createdAt?: string;
}

export interface Credential {
  id: string;
  website: string;
  username: string;
  password?: string; // Only present when revealed via getOne
  createdAt: string;
  updatedAt: string;
  ageDays?: number;
  ageStatus?: 'fresh' | 'aging' | 'stale';
}

export interface Session {
  id: string;
  userId: string;
  sessionIdentifier: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string | null;
  isCurrent?: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface PasswordCriteria {
  length12Plus: boolean;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  special: boolean;
  noObviousPattern: boolean;
}

export interface PasswordAnalysisResult {
  score: number;
  strength: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  entropy: number;
  length: number;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSpecial: boolean;
  hasCommonPattern: boolean;
  hasRepeatedChars: boolean;
  warnings: string[];
  suggestions: string[];
  criteria: PasswordCriteria;
}

export interface GeneratedPasswordResult {
  password: string;
  analysis: PasswordAnalysisResult;
}

export interface PasswordReuseGroup {
  count: number;
  websites: string[];
  usernames: string[];
}

export interface SecurityScoreReport {
  overallScore: number;
  status: 'Critical' | 'Poor' | 'Moderate' | 'Good' | 'Strong';
  breakdown: {
    passwordStrength: number;
    passwordReuse: number;
    mfaProtection: number;
    credentialHygiene: number;
    accountSecurity: number;
  };
  metrics: {
    totalCredentials: number;
    weakPasswordsCount: number;
    reusedPasswordsCount: number;
    mfaEnabled: boolean;
    activeSessionsCount: number;
    stalePasswordsCount?: number;
    agingPasswordsCount?: number;
    freshPasswordsCount?: number;
    averageAgeDays?: number;
  };
  reusedGroups: PasswordReuseGroup[];
  recommendations: {
    id: string;
    type: 'success' | 'warning' | 'danger';
    title: string;
    description: string;
    actionLabel?: string;
    actionRoute?: string;
  }[];
}

export interface MfaSetupData {
  secret: string;
  otpauthUrl?: string;
  qrCodeUrl: string;
  qrCodeDataUrl?: string;
  backupCodes: string[];
}


export interface ShareCreatePayload {
  secret: string;
  expirationMinutes?: number;
  passphrase?: string;
  label?: string;
}

export interface ShareCreateResponse {
  shareId: string;
  expiresAt: string;
  ttlSeconds: number;
  hasPassphrase: boolean;
  label: string;
}

export interface ShareMetadata {
  shareId: string;
  label: string;
  hasPassphrase: boolean;
  createdAt: string;
  expiresAt: string;
  viewsRemaining: number;
}

export interface ShareRevealResponse {
  secret: string;
  label: string;
  burnedAt: string;
}
