'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFirebaseCredentials } from '@/lib/credentials';

// Initialize Firebase with environment variables
let firebaseApp: FirebaseApp | undefined;

// Get Firebase configuration from environment variables
const getFirebaseConfigFromEnv = () => {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
};

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
  
  // Try to get credentials from database first
  const dbCredentials = await getFirebaseCredentials();
  
  // Use database credentials if available, otherwise use environment variables
  let config = getFirebaseConfigFromEnv();
  
  if (dbCredentials) {
    console.log('Initializing Firebase with credentials from database');
    config = {
      apiKey: dbCredentials.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: dbCredentials.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: dbCredentials.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: dbCredentials.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: dbCredentials.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: dbCredentials.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: dbCredentials.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };
  } else {
    console.log('Initializing Firebase with credentials from environment variables');
  }
  
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
const app = await initializeFirebase();
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

export { app, initializeFirebase }; 