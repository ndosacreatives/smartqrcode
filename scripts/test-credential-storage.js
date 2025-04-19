/**
 * Test script to verify Firestore credential storage
 * 
 * This script tests:
 * 1. If environment variables are loaded
 * 2. If the encryption/decryption works with the CREDENTIALS_ENCRYPTION_KEY
 * 3. If the credentials can be stored and retrieved from Firestore
 */
require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');
const admin = require('firebase-admin');

const ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY;

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const db = admin.firestore();

// Encrypt sensitive data
function encryptData(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// Decrypt sensitive data
function decryptData(data) {
  try {
    const [ivHex, encryptedData] = data.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Error decrypting data:', error);
    return '';
  }
}

async function testCredentialStorage() {
  console.log('=== Testing Firestore Credential Storage ===\n');
  
  // 1. Test encryption key
  if (!ENCRYPTION_KEY) {
    console.error('❌ CREDENTIALS_ENCRYPTION_KEY is not set in .env.local');
    process.exit(1);
  }
  console.log('✅ CREDENTIALS_ENCRYPTION_KEY is set');
  
  // 2. Test encryption/decryption
  const testValue = 'test-value-123';
  const encrypted = encryptData(testValue);
  const decrypted = decryptData(encrypted);
  
  if (decrypted === testValue) {
    console.log('✅ Encryption/decryption works correctly');
  } else {
    console.error('❌ Encryption/decryption failed');
    process.exit(1);
  }
  
  // 3. Test Firestore storage
  try {
    // Create test credential
    const testDoc = {
      TEST_CREDENTIAL: encryptData('test-firestore-value'),
      updatedAt: new Date(),
      updatedBy: 'test-script'
    };
    
    // Save to Firestore
    await db.collection('app_credentials').doc('test').set(testDoc);
    console.log('✅ Successfully wrote test credential to Firestore');
    
    // Read from Firestore
    const docSnapshot = await db.collection('app_credentials').doc('test').get();
    
    if (!docSnapshot.exists) {
      console.error('❌ Test document not found in Firestore');
      process.exit(1);
    }
    
    const data = docSnapshot.data();
    const retrievedValue = decryptData(data.TEST_CREDENTIAL);
    
    if (retrievedValue === 'test-firestore-value') {
      console.log('✅ Successfully retrieved and decrypted test credential from Firestore');
    } else {
      console.error('❌ Retrieved credential does not match original value');
      console.log('Retrieved:', retrievedValue);
      process.exit(1);
    }
    
    // Clean up test document
    await db.collection('app_credentials').doc('test').delete();
    console.log('✅ Successfully cleaned up test credential');
    
    console.log('\n=== All tests passed! Credential storage is working properly ===');
  } catch (error) {
    console.error('❌ Error testing Firestore storage:', error);
    process.exit(1);
  }
}

// Run the test
testCredentialStorage()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 