'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getClientFirebaseConfig } from '@/lib/credentials';

// Initialize Firebase with environment variables
let firebaseApp: FirebaseApp | undefined;

// Initialize Firebase with configuration
const initializeFirebase = async () => {
  if (typeof window === 'undefined') {
    return null; // Don't initialize on server side
  }
  
  if (firebaseApp) {
    return firebaseApp; // Return existing instance if already initialized
  }
  
  if (getApps().length > 0) {
    return getApps()[0]; // Return first app if already initialized
  }
  
  // Get the Firebase configuration
  const config = getClientFirebaseConfig();
  
  // Check if essential config values are present
  const missingConfig = Object.entries(config)
    .filter(([key, value]) => key !== 'measurementId' && !value) // measurementId is optional
    .map(([key]) => key);
  
  if (missingConfig.length > 0) {
    console.error(`Missing Firebase config values: ${missingConfig.join(', ')}`);
    return null;
  }
  
  try {
    firebaseApp = initializeApp(config);
    console.log('Firebase initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return null;
  }
};

// Initialize Firebase and export services
let app: FirebaseApp | null = null;

if (typeof window !== 'undefined') {
  // Only run in browser
  initializeFirebase().then(result => {
    app = result;
  });
}

export const auth = typeof window !== 'undefined' ? getAuth() : null;
export const db = typeof window !== 'undefined' ? getFirestore() : null;
export const storage = typeof window !== 'undefined' ? getStorage() : null;

export { app, initializeFirebase }; 