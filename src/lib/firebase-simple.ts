// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAI8KpMU-NK2VG2yGC6BAQ_v0imrbHh79I",
  authDomain: "smartqrdatabase-b5076.firebaseapp.com",
  projectId: "smartqrdatabase-b5076",
  storageBucket: "smartqrdatabase-b5076.appspot.com",
  messagingSenderId: "340286816273",
  appId: "1:340286816273:web:445441f6b1dceb23c2b1b0",
  measurementId: "G-SQCWHRR10N"
};

// Initialize Firebase - simple version without persistence
const app = initializeApp(firebaseConfig, { name: 'simple' });
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db }; 