import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { UserData } from '@/lib/types';

// Add no-cache headers to response
const addNoCacheHeaders = (response: NextResponse) => {
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  return response;
};

// Get specific user
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'User not found' }, { status: 404 })
      );
    }

    return addNoCacheHeaders(
      NextResponse.json({ user: userDocSnap.data() }, { status: 200 })
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    return addNoCacheHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    );
  }
}

// Update user data
export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const body = await request.json();

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
      return addNoCacheHeaders(
        NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
      );
    }

    const userDocRef = adminDb.collection('users').doc(userId);
    
    // Check if user exists first
    const userDocSnap = await userDocRef.get();
    if (!userDocSnap.exists) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'User not found' }, { status: 404 })
      );
    }
    
    await userDocRef.update(dataToUpdate);

    return addNoCacheHeaders(
      NextResponse.json({ message: 'User updated successfully' }, { status: 200 })
    );
  } catch (error) {
    console.error('Error updating user:', error);
    return addNoCacheHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    );
  }
}

// Delete user (Firestore document AND Firebase Auth user)
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
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