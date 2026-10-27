import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const MfaLoginSchema = z.object({
  mfaTempToken: z.string().min(1, 'MFA temporary token is required'),
  code: z.string().min(6, 'Verification code must be at least 6 characters'),
  isBackupCode: z.boolean().optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const VerifyResetTokenSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const CreateCredentialSchema = z.object({
  website: z.string().min(1, 'Website name or domain is required').max(255),
  username: z.string().min(1, 'Username or email is required').max(255),
  password: z.string().min(1, 'Password is required').max(512),
});

export const UpdateCredentialSchema = z.object({
  website: z.string().min(1, 'Website name or domain is required').max(255).optional(),
  username: z.string().min(1, 'Username or email is required').max(255).optional(),
  password: z.string().min(1, 'Password is required').max(512).optional(),
});

export const VerifyMfaSetupSchema = z.object({
  token: z.string().min(6, 'Code must be 6 digits').max(6),
  secret: z.string().min(1, 'Secret is required'),
  backupCodes: z.array(z.string()).min(1, 'Backup codes are required'),
});

export const DisableMfaSchema = z.object({
  password: z.string().min(1, 'Current password is required to disable MFA'),
});

export const AnalyzePasswordSchema = z.object({
  password: z.string(),
});

export const GeneratePasswordSchema = z.object({
  length: z.number().int().min(12).max(64).optional(),
  uppercase: z.boolean().optional(),
  lowercase: z.boolean().optional(),
  numbers: z.boolean().optional(),
  special: z.boolean().optional(),
});

export const CreateShareSchema = z.object({
  secret: z.string().min(1, 'Secret is required').max(10000, 'Secret too large'),
  expirationMinutes: z.number().min(0.01).max(10080).optional(),
  expirationSeconds: z.number().int().min(2).max(604800).optional(),
  passphrase: z.string().max(128).optional(),
  label: z.string().max(100).optional(),
});

export const RevealShareSchema = z.object({
  passphrase: z.string().max(128).optional(),
});

