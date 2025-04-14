import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from './firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Utility to check if a request is from an admin user
 * @param request NextRequest object
 * @returns DecodedIdToken if admin, null otherwise
 */
export async function checkAdminAuth(request: NextRequest): Promise<DecodedIdToken | null> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return null;
    }
    
    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken.uid) {
      return null;
    }
    
    // Check if the user has admin role in Firestore
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return null;
    }
    
    const userData = userDoc.data();
    if (!userData || userData.role !== 'admin') {
      return null;
    }
    
    return decodedToken;
  } catch (error) {
    console.error('Error in admin authentication:', error);
    return null;
  }
}

/**
 * Alternative admin check that gets the token from a cookie
 * @param request NextRequest object
 * @returns DecodedIdToken if admin, null otherwise
 */
export async function checkAdminAuthFromCookie(request: NextRequest): Promise<DecodedIdToken | null> {
  try {
    // Try to get token from cookie
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return null;
    }
    
    // Verify the session cookie
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (!decodedToken.uid) {
      return null;
    }
    
    // Check if the user has admin role in Firestore
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return null;
    }
    
    const userData = userDoc.data();
    if (!userData || userData.role !== 'admin') {
      return null;
    }
    
    return decodedToken;
  } catch (error) {
    console.error('Error in admin authentication from cookie:', error);
    return null;
  }
} 