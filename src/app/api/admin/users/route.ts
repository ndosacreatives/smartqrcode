import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

// Get all users
export async function GET(request: NextRequest) {
  try {
    const usersCollection = adminDb.collection('users');
    const snapshot = await usersCollection.get();
    
    const users = snapshot.docs.map(doc => doc.data());
    
    console.log(`Retrieved ${users.length} users`);
    
    // Add Cache-Control header to prevent caching
    return NextResponse.json(
      { users }, 
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      }
    );
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
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: displayName || undefined,
    });
    
    // Current timestamp for created/updated
    const now = admin.firestore.Timestamp.now();
    
    // Create user document in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
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