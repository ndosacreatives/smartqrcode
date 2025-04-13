import { NextResponse } from 'next/server';
import { doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserData } from '@/lib/types';

// Get specific user
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId;
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: userDocSnap.data() }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update user data
export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId;
    const body = await request.json();

    // Validate the incoming data - allow only specific fields
    const allowedFields: (keyof Partial<UserData>)[] = ['subscriptionTier', 'role', 'displayName'];
    const dataToUpdate: Partial<UserData> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Use type assertion to satisfy TypeScript, but be cautious
        (dataToUpdate as Record<string, unknown>)[field] = body[field];
      }
    }

    // Add updatedAt timestamp
    dataToUpdate.updatedAt = new Date(); // Use client-side Date for now

    if (Object.keys(dataToUpdate).length === 1 && 'updatedAt' in dataToUpdate) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const userDocRef = doc(db, 'users', userId);
    // Ensure the document exists before updating (optional but good practice)
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    await updateDoc(userDocRef, dataToUpdate);

    return NextResponse.json({ message: 'User updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete user
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`Deleting user ${userId} from Firestore`);
    
    // Delete user document from Firestore
    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);
    
    // Note: Deleting from Firebase Authentication requires Admin SDK
    // This part needs to be handled separately if using client-side SDK here.
    // await auth.deleteUser(userId); 
    
    return NextResponse.json({ 
      success: true, 
      message: 'User deleted from Firestore successfully'
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 