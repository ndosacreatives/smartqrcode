'use server';

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
function initAdmin() {
  const apps = getApps();
  
  if (!apps.length) {
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY 
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
        : undefined;
      
      const credential = cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      });
      
      initializeApp({
        credential,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
      
      console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error);
    }
  }
  
  return { auth: getAuth(), db: getFirestore() };
}

const { auth, db } = initAdmin();

// Verify user authentication and admin status
export async function verifyAuth(token: string) {
  try {
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // Get the user record
    const userRecord = await auth.getUser(uid);
    
    // Check if user is an admin by querying Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};
    const isAdmin = userData.role === 'admin';
    
    return { 
      isAuthenticated: true, 
      isAdmin,
      user: userRecord
    };
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return { 
      isAuthenticated: false, 
      isAdmin: false,
      user: null
    };
  }
}

export { auth, db }; 