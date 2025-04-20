import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

// Initialize Firebase Admin
const adminApp = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);
const adminStorage = getStorage(adminApp);

export { adminApp, adminAuth, adminDb, adminStorage }; 