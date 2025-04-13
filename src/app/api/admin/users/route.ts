import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function GET() {
  try {
    console.log('Fetching users from Firestore...');
    // Fetch all users from Firestore using admin SDK
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} users in Firestore`);
    
    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`Processing user: ${doc.id}`);
      return {
        id: doc.id,
        ...data
      };
    });
    
    return NextResponse.json({ users });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, password, displayName, role, subscriptionTier } = await request.json();
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' }, 
        { status: 400 }
      );
    }
    
    // Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || undefined,
    });
    
    // Current timestamp for created/updated
    const now = admin.firestore.Timestamp.now();
    
    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      displayName: displayName || null,
      role: role || 'user',
      subscriptionTier: subscriptionTier || 'free',
      createdAt: now,
      updatedAt: now,
      featuresUsage: {
        qrCodesGenerated: 0,
        barcodesGenerated: 0,
        bulkGenerations: 0,
        aiCustomizations: 0,
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: userRecord.uid,
        email,
        displayName,
        role,
        subscriptionTier
      }
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 