import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Get the authenticated user from a request
 * @param request The NextRequest object
 * @returns The decoded user token or null if authentication failed
 */
export async function getUserFromRequest(request: NextRequest): Promise<DecodedIdToken | null> {
  try {
    // First try to get the auth token from the Authorization header
    let token = getTokenFromHeader(request);
    
    // If no token in header, try to get it from cookies
    if (!token) {
      token = getTokenFromCookie(request);
    }
    
    // If we still don't have a token, the user is not authenticated
    if (!token) {
      return null;
    }
    
    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

/**
 * Get the auth token from the Authorization header
 */
function getTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split('Bearer ')[1];
}

/**
 * Get the auth token from cookies
 */
function getTokenFromCookie(request: NextRequest): string | null {
  // Look for the auth token in cookies
  const authCookie = request.cookies.get('auth_token');
  if (!authCookie) {
    return null;
  }
  
  return authCookie.value;
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(user: DecodedIdToken, role: string): Promise<boolean> {
  if (!user || !user.uid) {
    return false;
  }
  
  try {
    // Get the user's custom claims
    const userRecord = await adminAuth.getUser(user.uid);
    
    // Check if the user has the role in custom claims
    if (userRecord.customClaims && userRecord.customClaims.role === role) {
      return true;
    }
    
    // If no custom claims or role doesn't match, return false
    return false;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
} 