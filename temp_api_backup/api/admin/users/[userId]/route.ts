import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { UserData } from '@/lib/types';

// Add no-cache headers to response
const addNoCacheHeaders = (response: NextResponse) => {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  return response;
};

// Get specific user
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Await params before accessing userId
    const unwrappedParams = await params;
    const userId = unwrappedParams.userId;
    
    console.log(`Fetching user with ID: ${userId}`);
    
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      console.log(`User document not found in Firestore: ${userId}, checking Auth`);
      
      try {
        // Check if the user exists in Firebase Auth
        const authUser = await adminAuth.getUser(userId);
        console.log(`User exists in Auth but not in Firestore: ${userId}`);
        
        // Create a basic user object from Auth data
        const userData = {
          id: userId,
          email: authUser.email || '',
          displayName: authUser.displayName || '',
          role: 'user',
          subscriptionTier: 'free',
          createdAt: new Date(authUser.metadata.creationTime || Date.now()),
          lastLogin: new Date(authUser.metadata.lastSignInTime || Date.now()),
          // Add any additional default fields
        };
        
        // Optionally create the document in Firestore
        /*
        console.log(`Creating new Firestore document for user ${userId}`);
        
        // Format for Firestore
        const firestoreData = {
          ...userData,
          createdAt: admin.firestore.Timestamp.fromDate(new Date(userData.createdAt)),
          updatedAt: admin.firestore.Timestamp.now(),
          featuresUsage: {
            qrCodesGenerated: 0,
            barcodesGenerated: 0,
            bulkGenerations: 0,
            aiCustomizations: 0
          }
        };
        
        // Set the document
        await userDocRef.set(firestoreData);
        console.log(`Created Firestore document for user ${userId}`);
        */
        
        // Return the user data without requiring a document
        return addNoCacheHeaders(
          NextResponse.json({ 
            user: userData,
            documentExists: false,
            message: 'User exists in Auth but has no Firestore document yet'
          }, { status: 200 })
        );
      } catch (authError) {
        console.error(`User ${userId} not found in Firebase Auth:`, authError);
        return addNoCacheHeaders(
          NextResponse.json({ error: 'User not found in authentication system' }, { status: 404 })
        );
      }
    }

    // Get the user data and ensure ID is included
    const userData = userDocSnap.data();
    const userWithId = {
      ...userData,
      id: userId, // Ensure ID is always included
    };

    console.log(`Successfully fetched user: ${userId}`);
    
    return addNoCacheHeaders(
      NextResponse.json({ 
        user: userWithId, 
        documentExists: true 
      }, { status: 200 })
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    return addNoCacheHeaders(
      NextResponse.json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 })
    );
  }
}

// Update user data
export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Await params before accessing userId
    const unwrappedParams = await params;
    const userId = unwrappedParams.userId;
    
    console.log(`Attempting to update user with ID: ${userId}`);
    
    const body = await request.json();
    console.log(`Update data received:`, body);

    // Validate the incoming data - allow only specific fields
    const allowedFields: (keyof Partial<UserData>)[] = ['subscriptionTier', 'role', 'displayName'];
    const dataToUpdate: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        dataToUpdate[field] = body[field];
      }
    }

    // Add updatedAt timestamp using Admin SDK's server timestamp
    dataToUpdate.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    if (Object.keys(dataToUpdate).length === 1 && 'updatedAt' in dataToUpdate) {
      console.log(`No valid fields to update for user: ${userId}`);
      return addNoCacheHeaders(
        NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
      );
    }

    console.log(`Fields to update for user ${userId}:`, Object.keys(dataToUpdate).filter(k => k !== 'updatedAt'));
    
    const userDocRef = adminDb.collection('users').doc(userId);
    
    // Check if user exists first
    const userDocSnap = await userDocRef.get();
    if (!userDocSnap.exists) {
      console.log(`User document not found in Firestore: ${userId}, checking Auth`);
      
      try {
        // Check if the user exists in Firebase Auth
        const authUser = await adminAuth.getUser(userId);
        console.log(`User exists in Auth but not in Firestore: ${userId}, creating document`);
        
        // Create a new document for this user
        const now = admin.firestore.Timestamp.now();
        const newUserData = {
          id: userId,
          email: authUser.email || '',
          displayName: authUser.displayName || body.displayName || '',
          role: body.role || 'user',
          subscriptionTier: body.subscriptionTier || 'free',
          createdAt: now,
          updatedAt: now,
          featuresUsage: {
            qrCodesGenerated: 0,
            barcodesGenerated: 0,
            bulkGenerations: 0,
            aiCustomizations: 0
          }
        };
        
        // Set the initial document data
        await userDocRef.set(newUserData);
        console.log(`Created new Firestore document for user ${userId}`);
        
        // Now continue with the update below
      } catch (authError) {
        console.error(`User ${userId} not found in Firebase Auth:`, authError);
        return addNoCacheHeaders(
          NextResponse.json({ error: 'User not found in authentication system' }, { status: 404 })
        );
      }
    }
    
    // Now update the document
    await userDocRef.update(dataToUpdate);
    console.log(`User ${userId} updated successfully`);
    
    // Get the updated user data
    const updatedUserSnap = await userDocRef.get();
    const updatedUserData = updatedUserSnap.data();
    const updatedUser = {
      ...updatedUserData,
      id: userId,
    };

    return addNoCacheHeaders(
      NextResponse.json({ 
        message: 'User updated successfully',
        user: updatedUser
      }, { status: 200 })
    );
  } catch (error) {
    console.error('Error updating user:', error);
    return addNoCacheHeaders(
      NextResponse.json({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 })
    );
  }
}

// Delete user (Firestore document AND Firebase Auth user)
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Await params before accessing userId
    const unwrappedParams = await params;
    const userId = unwrappedParams.userId;
    
    if (!userId) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'User ID is required' }, { status: 400 })
      );
    }

    console.log(`Attempting to delete user ${userId} from Firestore and Auth.`);
    
    // 1. Delete user document from Firestore using adminDb
    const userDocRef = adminDb.collection('users').doc(userId);
    await userDocRef.delete();
    console.log(`User ${userId} deleted from Firestore.`);

    // 2. Delete user from Firebase Authentication using adminAuth
    try {
      await adminAuth.deleteUser(userId);
      console.log(`User ${userId} deleted from Firebase Auth.`);
    } catch (authError: any) {
      // Handle cases where user might exist in Firestore but not Auth
      if (authError.code === 'auth/user-not-found') {
        console.warn(`User ${userId} not found in Firebase Auth, only Firestore record deleted.`);
      } else {
        // Re-throw other auth errors to be caught by the outer catch block
        throw authError;
      }
    }
    
    return addNoCacheHeaders(
      NextResponse.json({ 
        success: true, 
        message: 'User deleted successfully from Firestore and Authentication.'
      }, { status: 200 })
    ); 
    
  } catch (error) {
    console.error('Error deleting user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    let statusCode = 500;
    if (error instanceof Error && (error as any).code === 'not-found') {
      statusCode = 404;
    }

    return addNoCacheHeaders(
      NextResponse.json({ error: errorMessage }, { status: statusCode })
    );
  }
} 