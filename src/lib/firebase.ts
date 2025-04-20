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

// Check if any essential Firebase config is missing
const isMissingConfig = !firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId;
const isBuildConfig = process.env.NODE_ENV === 'production' || process.env.STATIC_EXPORT_ONLY === 'true';

// Initialize Firebase App (prevent re-initialization)
let app: FirebaseApp;
try {
  if (!getApps().length) {
    if (isMissingConfig && isBuildConfig) {
      console.warn('Firebase config missing during build. Creating stub app.');
      // Create a minimal stub that satisfies type checks
      app = {
        name: '[stub]',
        options: {},
        automaticDataCollectionEnabled: false,
        toJSON: () => ({ name: '[stub]', options: {} })
      } as FirebaseApp;
    } else {
      app = initializeApp(firebaseConfig);
    }
  } else {
    app = getApp();
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  if (isBuildConfig) {
    console.warn('Creating Firebase stub app due to initialization error during build.');
    app = { name: '[stub-error]', options: {}, automaticDataCollectionEnabled: false, toJSON: () => ({}) } as FirebaseApp;
  } else {
    throw error; // Re-throw in development
  }
}

// Initialize Firebase services, using stubs if app is a stub
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | undefined;

if (app.name.startsWith('[stub')) {
  console.log('Using Firebase stub services for build.');
  auth = { app } as Auth; // Minimal stub satisfying type checks
  db = { app } as Firestore;
  storage = { app } as FirebaseStorage;
  analytics = undefined;
} else {
  // Initialize real services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Configure Persistence and Analytics only on client-side
  if (typeof window !== 'undefined') {
    // Multi-tab persistence
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firebase persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firebase persistence not supported');
      }
    });
    
    // Analytics
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      } else {
        console.log("Firebase Analytics not supported.");
      }
    });
    
    // Auth settings (client-side only)
    auth.languageCode = 'en';
    console.log('Firebase Auth configured.');
  }
}

// Function to check if Firebase is properly configured and initialized
export function isFirebaseAvailable(): boolean {
  // Check if the app object is NOT a stub and auth/db were likely initialized
  return !!app && !app.name.startsWith('[stub') && !!auth && !!db;
}

// Recaptcha Verifier - must be called client-side
export function getRecaptchaVerifier(elementId: string): RecaptchaVerifier | null {
  if (typeof window === 'undefined' || !auth || app.name.startsWith('[stub')) {
    console.error('Cannot get RecaptchaVerifier: Not in browser or Auth not initialized/stubbed.');
    return null;
  }
  try {
    if (!document.getElementById(elementId)) {
       const div = document.createElement('div'); 
       div.id = elementId; 
       document.body.appendChild(div); // Create container if missing
       console.warn(`Created missing Recaptcha container '${elementId}'.`);
    }
    return new RecaptchaVerifier(auth, elementId, {
      size: 'invisible',
      callback: (response: any) => { console.log('reCAPTCHA verified'); },
      'expired-callback': () => { console.warn('reCAPTCHA expired'); }
    });
  } catch (error) {
    console.error("Error creating RecaptchaVerifier:", error);
    return null;
  }
}

export { app, auth, db, storage, analytics }; 