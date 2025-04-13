import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import prompts from 'prompts'; // For interactive input

// --- Configuration ---
const SALT_ROUNDS = 10; // Recommended bcrypt salt rounds
const SERVICE_ACCOUNT_PATH = path.resolve(process.cwd(), 'firebase-key.json'); // Path to your service account key
// -------------------

// Load service account credentials
let serviceAccount;
try {
  const serviceAccountJson = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8');
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (error) {
  console.error(`Error loading service account key from ${SERVICE_ACCOUNT_PATH}:`, error);
  console.error('Please ensure firebase-key.json exists in the project root and is configured correctly.');
  process.exit(1);
}

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const adminsCollection = db.collection('admins');

async function createAdmin() {
  console.log('--- Create Admin User ---');

  const response = await prompts([
    {
      type: 'text',
      name: 'email',
      message: 'Enter admin email address:',
      validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? true : 'Invalid email format'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter admin password (min 8 characters):',
      validate: value => value.length >= 8 ? true : 'Password must be at least 8 characters'
    }
  ]);

  if (!response.email || !response.password) {
    console.log('Admin creation cancelled.');
    return;
  }

  const { email, password } = response;

  try {
    // Check if admin already exists
    const existingAdmin = await adminsCollection.where('email', '==', email).limit(1).get();
    if (!existingAdmin.empty) {
      console.error(`Admin with email ${email} already exists.`);
      return;
    }

    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create admin document
    const adminData = {
      email: email,
      passwordHash: hashedPassword,
      createdAt: new Date()
    };

    console.log(`Creating admin document for ${email}...`);
    const docRef = await adminsCollection.add(adminData);

    console.log(`Successfully created admin user with ID: ${docRef.id} for email: ${email}`);

  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdmin(); 