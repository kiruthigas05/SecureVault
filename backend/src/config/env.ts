import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or current directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/securevault',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/securevault',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  SESSION_SECRET: process.env.SESSION_SECRET || 'securevault_default_session_secret_change_in_production_32b',
  JWT_SECRET: process.env.JWT_SECRET || 'securevault_super_jwt_secret_key_needs_to_be_32_bytes_long',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32-byte hex (64 chars)
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  ENABLE_EMAIL_SIMULATION: process.env.ENABLE_EMAIL_SIMULATION !== 'false',
};
