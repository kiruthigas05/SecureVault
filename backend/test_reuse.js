const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const ENCRYPTION_KEY = Buffer.from(
  require('fs').readFileSync('.env', 'utf8')
    .split('\n')
    .find(l => l.startsWith('ENCRYPTION_KEY='))
    ?.replace('ENCRYPTION_KEY=', '')
    ?.trim() || '',
  'hex'
);

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encryptedPassword: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

async function main() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('securevault');

  // Get demo user
  const user = await db.collection('users').findOne({ email: 'demo@example.com' });
  console.log('User:', user.email);

  // Get existing credentials
  const existing = await db.collection('credentials').find({ userId: user._id.toString() }).toArray();
  console.log('\nExisting credentials:', existing.length);

  // Check if duplicate already exists
  const dupExists = existing.find(c => c.website === 'Facebook (Reuse Test)');
  if (dupExists) {
    console.log('Duplicate test credential already exists!');
    await client.close();
    return;
  }

  // Add a NEW credential with the SAME password as GitHub Enterprise
  // GitHub Enterprise uses "DemoPassword123!" — let's add Facebook with same password
  const samePassword = 'DemoPassword123!';
  const { encryptedPassword, iv, authTag } = encrypt(samePassword);

  await db.collection('credentials').insertOne({
    userId: user._id.toString(),
    website: 'Facebook (Reuse Test)',
    username: 'kiruthiga@facebook.com',
    encryptedPassword,
    iv,
    authTag,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log('\nAdded new credential: Facebook with SAME password as GitHub!');
  console.log('Now check Security Dashboard at http://localhost:3000/dashboard');
  console.log('You will see: Password Reuse WARNING badge');

  await client.close();
}
main().catch(console.error);
