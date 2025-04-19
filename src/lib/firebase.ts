// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, Auth } from "firebase/auth";
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  CACHE_SIZE_UNLIMITED,
  enableMultiTabIndexedDbPersistence,
  Firestore
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

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

// Check if any essential Firebase config is missing, especially during build
const isMissingConfig = !firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId;

// Initialize Firebase App (prevent re-initialization)
let app: FirebaseApp;
try {
  if (!getApps().length) {
    if (isMissingConfig && process.env.NODE_ENV === 'production') {
      console.warn('Firebase configuration is incomplete. Using stub for build.');
      app = {} as FirebaseApp; // Type casting for build process
    } else {
      app = initializeApp(firebaseConfig);
    }
  } else {
    app = getApp();
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Provide a stub for SSG build process to continue
  if (process.env.NODE_ENV === 'production' || process.env.STATIC_EXPORT_ONLY === 'true') {
    console.warn('Creating Firebase stub for build process');
    app = {} as FirebaseApp; // Type casting for build
  } else {
    throw error; // Re-throw in development for debugging
  }
}

// Initialize Firebase services conditionally to prevent errors during build
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | undefined;

// Only initialize services if not in SSG/build mode or if app is properly initialized
const canInitServices = 
  typeof window !== 'undefined' && // Browser environment
  !(process.env.STATIC_EXPORT_ONLY === 'true'); // Not in static export

if (canInitServices && app && typeof app.name === 'string') {
  try {
    // Initialize Firebase Authentication
    auth = getAuth(app);
    
    // Configure auth settings for global phone authentication
    if (typeof window !== 'undefined') {
      // Only run in browser environment
      auth.settings.appVerificationDisabledForTesting = false;
      auth.languageCode = 'en'; // Set default language for SMS messages
      console.log('Firebase Auth configured for global phone authentication');
    }
    
    // Initialize Firestore
    db = getFirestore(app);
    
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
    
    // Initialize Storage
    storage = getStorage(app);
    
    // Initialize Analytics only if supported (runs only in browser)
    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
        } else {
          console.log("Firebase Analytics is not supported in this environment.");
        }
      });
    }
  } catch (error) {
    console.error('Error initializing Firebase services:', error);
  }
} else {
  console.log('Skipping Firebase service initialization during build');
  // Create stub objects for export
  auth = {} as Auth;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
}

// Create a function to get a RecaptchaVerifier instance when needed
// This prevents trying to access DOM elements at module initialization
export function getRecaptchaVerifier(elementId: string) {
  if (!auth || !auth.app) {
    console.error('Auth not initialized properly');
    return null;
  }
  
  try {
    return new RecaptchaVerifier(auth, elementId, {
      size: 'invisible',
      callback: () => {
        console.log('Captcha resolved');
      },
      'expired-callback': () => {
        console.log('Captcha expired');
      }
    });
  } catch (error) {
    console.error('Error creating RecaptchaVerifier:', error);
    return null;
  }
}

export { app, auth, db, storage, analytics }; 