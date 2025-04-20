import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if any essential Firebase config is missing
const isMissingConfig = !firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId;
const isBuildConfig = process.env.NODE_ENV === 'production' || process.env.STATIC_EXPORT_ONLY === 'true';

// Initialize Firebase App (prevent re-initialization)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// Create a stub auth object for build time
const createStubAuth = (app: FirebaseApp): Auth => {
  return {
    app,
    name: 'auth',
    config: {},
    currentUser: null,
    languageCode: null,
    tenantId: null,
    settings: { appVerificationDisabledForTesting: false },
    onAuthStateChanged: () => () => {},
    onIdTokenChanged: () => () => {},
    signOut: async () => {},
    updateCurrentUser: async () => {},
    useDeviceLanguage: () => {},
    setPersistence: async () => {},
    signInWithCredential: async () => ({ user: null }),
    signInWithCustomToken: async () => ({ user: null }),
    signInWithEmailAndPassword: async () => ({ user: null }),
    signInWithPhoneNumber: async () => ({ verificationId: '' }),
    signInWithPopup: async () => ({ user: null }),
    signInWithRedirect: async () => {},
    updatePassword: async () => {},
    verifyPasswordResetCode: async () => '',
    confirmPasswordReset: async () => {},
    applyActionCode: async () => {},
    checkActionCode: async () => ({ data: {} }),
    sendPasswordResetEmail: async () => {},
    sendSignInLinkToEmail: async () => {},
    isSignInWithEmailLink: () => false,
    signInWithEmailLink: async () => ({ user: null }),
  } as unknown as Auth;
};

// Create a stub firestore object for build time
const createStubFirestore = (app: FirebaseApp): Firestore => {
  return {
    app,
    type: 'firestore',
    toJSON: () => ({}),
  } as Firestore;
};

// Create a stub storage object for build time
const createStubStorage = (app: FirebaseApp): FirebaseStorage => {
  return {
    app,
    maxOperationRetryTime: 0,
    maxUploadRetryTime: 0,
  } as FirebaseStorage;
};

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
    app = getApps()[0];
  }

  // Initialize services only if we have a valid app
  if (!app.name.startsWith('[stub')) {
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } else {
    // Create stub services for build
    auth = createStubAuth(app);
    db = createStubFirestore(app);
    storage = createStubStorage(app);
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  if (isBuildConfig) {
    console.warn('Creating Firebase stub app due to initialization error during build.');
    app = { name: '[stub-error]', options: {}, automaticDataCollectionEnabled: false, toJSON: () => ({}) } as FirebaseApp;
    auth = createStubAuth(app);
    db = createStubFirestore(app);
    storage = createStubStorage(app);
  } else {
    throw error; // Re-throw in development
  }
}

// Function to check if Firebase is properly configured and initialized
export function isFirebaseAvailable(): boolean {
  return !!app && !app.name.startsWith('[stub') && !!auth && !!db;
}

export { app, auth, db, storage }; 