import { NextRequest, NextResponse } from 'next/server';
import { doc, getFirestore, setDoc, Timestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAI8KpMU-NK2VG2yGC6BAQ_v0imrbHh79I",
  authDomain: "smartqrdatabase-b5076.firebaseapp.com",
  projectId: "smartqrdatabase-b5076",
  storageBucket: "smartqrdatabase-b5076.appspot.com",
  messagingSenderId: "340286816273",
  appId: "1:340286816273:web:445441f6b1dceb23c2b1b0",
  measurementId: "G-SQCWHRR10N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig, { name: 'admin-api' });
const db = getFirestore(app);

export async function POST(request: NextRequest) {
  try {
    // Extract user ID from request
    const body = await request.json();
    const { userId, email } = body;
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }
    
    // Update user document
    await setDoc(doc(db, 'users', userId), {
      role: 'admin',
      email: email || 'unknown@example.com',
      updatedAt: Timestamp.now()
    }, { merge: true });
    
    // Return success response
    return NextResponse.json({ success: true, message: 'User is now an admin. Please sign out and sign back in for changes to take effect.' });
  } catch (error) {
    console.error('Error making user admin:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 