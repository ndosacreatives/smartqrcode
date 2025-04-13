import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

// Get all users
export async function GET(request: NextRequest) {
  try {
    console.log('Starting to fetch users from Firestore...');
    
    const usersCollection = adminDb.collection('users');
    
    if (!usersCollection) {
      console.error('Users collection reference is invalid');
      return NextResponse.json(
        { error: 'Database configuration error' }, 
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Pragma': 'no-cache'
          }
        }
      );
    }
    
    const snapshot = await usersCollection.get();
    
    console.log(`Retrieved snapshot with ${snapshot.size} documents`);
    
    // Convert the documents to a more predictable format with explicit ID handling
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure each user has an id field matching the document ID
      return {
        ...data,
        id: doc.id // Make sure id is explicitly included
      };
    });
    
    console.log(`Processed ${users.length} users`);
    
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
    // Log the actual error with full details
    console.error('Error fetching users:', error);
    
    let errorMessage = 'Failed to fetch users';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      }, 
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
    console.log('Starting user creation process...');
    
    const { email, password, displayName, role, subscriptionTier } = await request.json();
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' }, 
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Pragma': 'no-cache'
          }
        }
      );
    }
    
    console.log(`Creating user with email: ${email}`);
    
    // Create user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: displayName || undefined,
    });
    
    console.log(`User created in Firebase Auth with UID: ${userRecord.uid}`);
    
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
    
    console.log(`User document created in Firestore for UID: ${userRecord.uid}`);
    
    return NextResponse.json(
      { 
        success: true, 
        user: {
          id: userRecord.uid,
          email,
          displayName,
          role: role || 'user',
          subscriptionTier: subscriptionTier || 'free',
          createdAt: now
        }
      },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      }
    );
    
  } catch (error) {
    console.error('Error creating user:', error);
    
    let errorMessage = 'Internal server error';
    let errorDetails = '';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
      
      // Handle common Firebase Auth errors
      if (errorMessage.includes('email-already-exists')) {
        errorMessage = 'The email address is already in use';
        statusCode = 409; // Conflict
      } else if (errorMessage.includes('invalid-email')) {
        errorMessage = 'The email address is not valid';
        statusCode = 400; // Bad Request
      } else if (errorMessage.includes('weak-password')) {
        errorMessage = 'Password should be at least 6 characters';
        statusCode = 400; // Bad Request
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      }, 
      { 
        status: statusCode,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      }
    );
  }
} 