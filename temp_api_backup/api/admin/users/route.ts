import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

// Get all users
export async function GET(request: NextRequest) {
  try {
    console.log('Starting to fetch users from Firebase Auth and Firestore...');
    
    // Fetch users from Firebase Authentication
    const authUsers = [];
    let pageToken = undefined;
    let hasMoreUsers = true;
    
    while (hasMoreUsers) {
      try {
        const listUsersResult = await adminAuth.listUsers(1000, pageToken);
        authUsers.push(...listUsersResult.users);
        
        if (listUsersResult.pageToken) {
          pageToken = listUsersResult.pageToken;
        } else {
          hasMoreUsers = false;
        }
      } catch (error) {
        console.error('Error listing users from Firebase Auth:', error);
        hasMoreUsers = false;
      }
    }
    
    console.log(`Retrieved ${authUsers.length} users from Firebase Auth`);
    
    // Fetch user documents from Firestore
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
    console.log(`Retrieved snapshot with ${snapshot.size} documents from Firestore`);
    
    // Create a map of Firestore user documents by user ID
    const firestoreUserMap: Record<string, any> = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      firestoreUserMap[doc.id] = data;
    });
    
    // Merge Auth and Firestore data, prioritizing Firestore data
    const mergedUsers = authUsers.map(authUser => {
      const uid = authUser.uid;
      const firestoreData = firestoreUserMap[uid] || {};
      
      // If user doesn't exist in Firestore, create a minimal profile from Auth data
      if (!firestoreData.id) {
        return {
          id: uid,
          email: authUser.email,
          displayName: authUser.displayName || null,
          role: 'user', // Default role
          subscriptionTier: 'free', // Default tier
          createdAt: authUser.metadata.creationTime ? new Date(authUser.metadata.creationTime) : null,
          // Add any other required default fields here
        };
      }
      
      // Return Firestore data with Auth data as fallback for missing fields
      return {
        ...firestoreData,
        id: uid, // Ensure ID is always set
        email: firestoreData.email || authUser.email,
        displayName: firestoreData.displayName || authUser.displayName || null,
      };
    });
    
    console.log(`Processed ${mergedUsers.length} total users`);
    
    // Add Cache-Control header to prevent caching
    return NextResponse.json(
      { users: mergedUsers }, 
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

// Add no-cache headers to response
const addNoCacheHeaders = (response: NextResponse) => {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  return response;
}; 