// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from "firebase/analytics";

// --- TEMPORARY DEBUGGING: Hardcode config ---
const firebaseConfig = {
  apiKey: "AIzaSyAI8KpMU-NK2VG2yGC6BAQ_v0imrbHh79I", // Use the actual key provided
  authDomain: "smartqrdatabase-b5076.firebaseapp.com",
  projectId: "smartqrdatabase-b5076",
  storageBucket: "smartqrdatabase-b5076.appspot.com", // Corrected bucket name
  messagingSenderId: "340286816273",
  appId: "1:340286816273:web:445441f6b1dceb23c2b1b0",
  measurementId: "G-SQCWHRR10N"
};
// --- END TEMPORARY DEBUGGING ---

// --- Comment out reading from process.env ---
/*
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};
*/
// --- End comment out ---

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

// Initialize Firestore and get a reference to the service
const db = getFirestore(app);

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

export { app, auth, db, storage, analytics }; 