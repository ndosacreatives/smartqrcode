import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Get the authenticated user from the request
 * @param request The Next.js request object
 * @returns The decoded user token or null if not authenticated
 */
export async function getUserFromRequest(request: NextRequest): Promise<DecodedIdToken | null> {
  try {
    // Check for token in Authorization header
    const authHeader = request.headers.get('authorization');
    let token = authHeader ? getTokenFromHeader(authHeader) : null;

    // If no token in header, check cookies
    if (!token) {
      token = getTokenFromCookie(request);
    }

    if (!token) {
      console.log('API Auth: No authentication token found in request');
      return null;
    }

    try {
      // Verify the token
      console.log('API Auth: Verifying token...');
      const decodedToken = await adminAuth.verifyIdToken(token);
      console.log(`API Auth: Token verified for user ${decodedToken.uid}`);
      return decodedToken;
    } catch (error) {
      console.error('API Auth: Token verification failed:', error);
      return null;
    }
  } catch (error) {
    console.error('API Auth: Error in getUserFromRequest:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader The Authorization header value
 * @returns The token or null if not found/valid
 */
export function getTokenFromHeader(authHeader: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  if (!token) {
    console.log('API Auth: Bearer token is empty');
    return null;
  }

  return token;
}

/**
 * Extract token from cookies
 * @param request The Next.js request object
 * @returns The token or null if not found
 */
export function getTokenFromCookie(request: NextRequest): string | null {
  try {
    const sessionCookie = request.cookies.get('session');
    const authCookie = request.cookies.get('firebase-auth-token');
    
    if (sessionCookie?.value) {
      return sessionCookie.value;
    }
    
    if (authCookie?.value) {
      return authCookie.value;
    }
    
    return null;
  } catch (error) {
    console.error('API Auth: Error extracting token from cookies:', error);
    return null;
  }
}

/**
 * Check if a user has a specific role
 * @param user The decoded user token
 * @param role The role to check for
 * @returns True if the user has the role, false otherwise
 */
export async function hasRole(user: DecodedIdToken, role: string): Promise<boolean> {
  if (!user) {
    console.log('API Auth: No user provided to hasRole check');
    return false;
  }

  try {
    // Check custom claims for the role
    const customClaims = user.customClaims || {};
    if (customClaims.admin === true && role === 'admin') {
      console.log(`API Auth: User ${user.uid} has admin role`);
      return true;
    }
    
    if (customClaims.roles && Array.isArray(customClaims.roles) && customClaims.roles.includes(role)) {
      console.log(`API Auth: User ${user.uid} has role ${role}`);
      return true;
    }

    // If user is not verified to have the role, fetch fresh user data
    const userRecord = await adminAuth.getUser(user.uid);
    const userClaims = userRecord.customClaims || {};
    
    if (userClaims.admin === true && role === 'admin') {
      console.log(`API Auth: User ${user.uid} verified as admin from fresh data`);
      return true;
    }
    
    if (userClaims.roles && Array.isArray(userClaims.roles) && userClaims.roles.includes(role)) {
      console.log(`API Auth: User ${user.uid} verified with role ${role} from fresh data`);
      return true;
    }
    
    console.log(`API Auth: User ${user.uid} does not have role ${role}`);
    return false;
  } catch (error) {
    console.error(`API Auth: Error checking role ${role} for user:`, error);
    return false;
  }
} 