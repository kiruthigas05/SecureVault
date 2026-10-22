import { initDb } from './db';
import { User, Credential } from '../models';
import { HashingService } from '../services/hashing.service';
import { encryptionService } from '../services/encryption.service';
import { AuditLoggerService } from '../services/auditLogger.service';

async function seed() {
  console.log('--- Starting SecureVault Database Seeding (MongoDB / MERN) ---');
  await initDb();

  const demoEmail = 'demo@example.com';
  const demoPassword = 'DemoPassword123!';

  // Check if demo user already exists
  let user = await User.findOne({ email: demoEmail });
  let userId: string;

  if (!user) {
    const passwordHash = await HashingService.hashPassword(demoPassword);
    user = await User.create({
      name: 'Demo Security Officer',
      email: demoEmail,
      passwordHash,
      mfaEnabled: false,
    });
    userId = user.id;
    console.log(`Demo user created: ${demoEmail} (Password: ${demoPassword})`);
  } else {
    userId = user.id;
    console.log(`Demo user already exists: ${demoEmail}`);
  }

  // Sample credentials to showcase AES-256-GCM encryption & reuse detection
  const demoCredentials = [
    {
      website: 'GitHub Enterprise',
      username: 'demo_dev@github.com',
      password: 'SuperSecurePass!2026',
    },
    {
      website: 'Google Cloud Platform',
      username: 'cloud_admin@demo.org',
      password: 'SuperSecurePass!2026', // Intentionally reused to trigger detection
    },
    {
      website: 'AWS Production Console',
      username: 'aws_security@demo.org',
      password: 'AWS#Vault_Key99$xLp',
    },
    {
      website: 'Slack Workspace',
      username: 'officer@demo.org',
      password: 'weak123', // Intentionally weak to test hygiene score
    },
  ];

  // Check existing credentials for demo user
  const credsCount = await Credential.countDocuments({ userId });

  if (credsCount === 0) {
    for (const cred of demoCredentials) {
      const { encryptedPassword, iv, authTag } = encryptionService.encrypt(cred.password);
      await Credential.create({
        userId,
        website: cred.website,
        username: cred.username,
        encryptedPassword,
        iv,
        authTag,
      });
    }
    console.log(`Inserted ${demoCredentials.length} encrypted credentials.`);
  } else {
    console.log('Credentials already seeded.');
  }

  // Seed initial audit log
  await AuditLoggerService.log({
    userId,
    action: 'SEED_INITIALIZATION',
    ipAddress: '127.0.0.1',
    userAgent: 'SecureVault-Seed/1.0',
    metadata: { note: 'Academic FSD Demonstration environment ready' },
  });

  console.log('--- Database Seeding Complete ---');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

