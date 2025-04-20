import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getUserFromRequest, hasRole } from '@/lib/api-auth';
import crypto from 'crypto';

// Encryption key from environment (generate a secure one for production)
const ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY || 'your-secure-encryption-key';

// Ensure the encryption key is valid
if (!ENCRYPTION_KEY || ENCRYPTION_KEY === 'your-secure-encryption-key') {
  console.warn('WARNING: Using default encryption key. Set CREDENTIALS_ENCRYPTION_KEY for production.');
}

// Encrypt sensitive data
function encryptData(data: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// Decrypt sensitive data
export function decryptData(data: string): string {
  try {
    const [ivHex, encryptedData] = data.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Error decrypting data:', error);
    return '';
  }
}

// Helper function to add no-cache headers
const addNoCacheHeaders = (response: NextResponse) => {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
};

// Get all credentials (decrypted for admin view)
export async function GET(request: NextRequest) {
  console.log('[ADMIN API] Received GET request for credentials');
  try {
    // Authenticate and authorize admin user
    const user = await getUserFromRequest(request);
    if (!user) {
      console.log('[ADMIN API] Authentication failed: No user found in request');
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Unauthorized - No user found' }, { status: 401 })
      );
    }
    
    if (!(await hasRole(user, 'admin'))) {
      console.log(`[ADMIN API] Authorization failed: User ${user.uid} is not an admin`);
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Unauthorized - Not an admin user' }, { status: 401 })
      );
    }

    console.log(`[ADMIN API] User ${user.uid} authenticated and authorized as admin`);

    try {
      // Get credentials from Firestore - using the same collection as in lib/credentials.ts
      const credentialsDoc = await adminDb.collection('app_credentials').doc('payment_apis').get();
      
      if (!credentialsDoc.exists) {
        console.log('[ADMIN API] No credentials document found in Firestore');
        return addNoCacheHeaders(
          NextResponse.json({ credentials: {} }, { status: 200 })
        );
      }
      
      const encryptedCredentials = credentialsDoc.data() || {};
      console.log(`[ADMIN API] Found ${Object.keys(encryptedCredentials).length - 2} encrypted credentials`); // -2 for updatedAt and updatedBy
      
      const decryptedCredentials: Record<string, string> = {};
      
      // Decrypt each credential for admin view
      for (const [key, value] of Object.entries(encryptedCredentials)) {
        if (key !== 'updatedAt' && key !== 'updatedBy' && typeof value === 'string') {
          try {
            decryptedCredentials[key] = decryptData(value);
            if (!decryptedCredentials[key]) {
              console.warn(`[ADMIN API] Empty decrypted value for ${key}`);
            }
          } catch (error) {
            console.error(`[ADMIN API] Failed to decrypt credential ${key}:`, error);
            decryptedCredentials[key] = ''; // Handle decryption errors
          }
        }
      }
      
      console.log(`[ADMIN API] Successfully decrypted ${Object.keys(decryptedCredentials).length} credentials`);
      
      return addNoCacheHeaders(
        NextResponse.json({ 
          credentials: decryptedCredentials,
          updatedAt: encryptedCredentials.updatedAt || null,
        }, { status: 200 })
      );
    } catch (firestoreError) {
      console.error('[ADMIN API] Error accessing Firestore:', firestoreError);
      return addNoCacheHeaders(
        NextResponse.json({ 
          error: 'Database error', 
          message: firestoreError instanceof Error ? firestoreError.message : 'Unknown database error'
        }, { status: 500 })
      );
    }
  } catch (error) {
    console.error('[ADMIN API] Error retrieving credentials:', error);
    return addNoCacheHeaders(
      NextResponse.json({ 
        error: 'Failed to retrieve credentials',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    );
  }
}

// Save credentials (encrypt and store)
export async function POST(request: NextRequest) {
  console.log('[ADMIN API] Received POST request to save credentials');
  try {
    // Authenticate and authorize admin user
    const user = await getUserFromRequest(request);
    if (!user || !(await hasRole(user, 'admin'))) {
      console.log('[ADMIN API] POST: Authentication or authorization failed');
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    // Get credentials data
    const data = await request.json();
    console.log(`[ADMIN API] Received ${Object.keys(data).length} credentials to save`);
    
    // Store encrypted credentials in Firestore
    const encryptedCredentials: Record<string, string> = {};
    
    // Encrypt each credential
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && value.trim() !== '') {
        encryptedCredentials[key] = encryptData(value);
      }
    }
    
    console.log(`[ADMIN API] Encrypted ${Object.keys(encryptedCredentials).length} credentials`);
    
    // Save to Firestore in app_credentials collection with payment_apis document
    await adminDb.collection('app_credentials').doc('payment_apis').set({
      ...encryptedCredentials,
      updatedAt: new Date(),
      updatedBy: user.uid
    }, { merge: true });

    console.log(`[ADMIN API] Credentials successfully saved by admin user ${user.uid}`);

    return addNoCacheHeaders(
      NextResponse.json({ 
        success: true, 
        message: 'Credentials stored securely' 
      })
    );
  } catch (error) {
    console.error('[ADMIN API] Error saving credentials:', error);
    return addNoCacheHeaders(
      NextResponse.json({ 
        error: 'Failed to save credentials',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    );
  }
} 