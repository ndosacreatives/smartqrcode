'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getClientFirebaseConfig } from '@/lib/credentials';

// Initialize Firebase with environment variables
let firebaseApp: FirebaseApp | undefined;

// Get Firebase configuration from environment variables
const config = getClientFirebaseConfig();

// Check if we're in the browser
const isBrowser = typeof window !== 'undefined';

// Initialize Firebase if in browser
if (isBrowser) {
  if (getApps().length === 0) {
    // Check if essential config values are present
    const missingConfig = Object.entries(config)
      .filter(([key, value]) => key !== 'measurementId' && !value) // measurementId is optional
      .map(([key]) => key);
    
    if (missingConfig.length === 0) {
      try {
        firebaseApp = initializeApp(config);
        console.log('Firebase initialized successfully');
      } catch (error) {
        console.error('Error initializing Firebase:', error);
      }
    } else {
      console.error(`Missing Firebase config values: ${missingConfig.join(', ')}`);
    }
  } else {
    firebaseApp = getApps()[0];
  }
}

// Export services - pass the firebaseApp to service initializers
export const auth = isBrowser && firebaseApp ? getAuth(firebaseApp) : null;
export const db = isBrowser && firebaseApp ? getFirestore(firebaseApp) : null;
export const storage = isBrowser && firebaseApp ? getStorage(firebaseApp) : null;

// In React components, always check if these are null before using
export { firebaseApp as app }; 