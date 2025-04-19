// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  CACHE_SIZE_UNLIMITED,
  enableMultiTabIndexedDbPersistence
} from "firebase/firestore";
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase App (prevent re-initialization)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Configure auth settings for global phone authentication
if (typeof window !== 'undefined') {
  // Only run in browser environment
  auth.settings.appVerificationDisabledForTesting = false; // Enable this only for testing
  
  // Set the default region to global in the auth settings
  // This enables SMS verification for phone authentication globally
  auth.languageCode = 'en'; // Set default language for SMS messages
  
  console.log('Firebase Auth configured for global phone authentication');
}

// Initialize Firestore with performance settings
const db = getFirestore(app);

// Enable offline persistence only in browser environment
if (typeof window !== 'undefined') {
  // Use multi-tab persistence to fix the exclusive access error
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab
      console.warn('Firebase persistence failed: Multiple tabs open');
      console.warn('Falling back to memory-only persistence');
    } else if (err.code === 'unimplemented') {
      // Current browser doesn't support persistence
      console.warn('Firebase persistence not supported in this browser');
    }
  });
}

const storage = getStorage(app);

// Initialize Firebase Analytics only if supported (runs only in browser)
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    } else {
        console.log("Firebase Analytics is not supported in this environment.");
    }
  });
}

// Create a function to get a RecaptchaVerifier instance when needed
// This prevents trying to access DOM elements at module initialization
export function getRecaptchaVerifier(elementId: string) {
  return new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
    callback: () => {
      console.log('Captcha resolved');
    },
    'expired-callback': () => {
      console.log('Captcha expired');
    }
  });
}

export { app, auth, db, storage, analytics }; 