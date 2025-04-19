import { adminDb } from '@/lib/firebase-admin';
import { decryptData } from '@/app/api/admin/credentials/route';

/**
 * Get a credential from either environment variables or encrypted storage
 * @param key The credential key to retrieve
 * @returns The credential value or null if not found
 */
export async function getCredential(key: string): Promise<string | null> {
  try {
    // First check environment variables
    if (process.env[key]) {
      return process.env[key] as string;
    }
    
    // If not in environment, check Firestore
    const credentialsDoc = await adminDb.collection('app_credentials').doc('payment_apis').get();
    
    if (!credentialsDoc.exists) {
      console.warn(`No app_credentials/payment_apis document found when looking for ${key}`);
      return null;
    }
    
    const credentials = credentialsDoc.data();
    
    if (!credentials || !credentials[key]) {
      return null;
    }
    
    try {
      // Decrypt the credential
      const decrypted = decryptData(credentials[key]);
      if (!decrypted) {
        console.warn(`Failed to decrypt credential: ${key}`);
      }
      return decrypted;
    } catch (decryptError) {
      console.error(`Error decrypting credential ${key}:`, decryptError);
      return null;
    }
  } catch (error) {
    console.error(`Error retrieving credential ${key}:`, error);
    return null;
  }
}

/**
 * Get multiple credentials at once
 * @param keys Array of credential keys to retrieve
 * @returns Array of credential values in same order as keys
 */
export async function getCredentials(keys: string[]): Promise<string[]> {
  const results: string[] = [];
  
  for (const key of keys) {
    const value = await getCredential(key);
    results.push(value || '');
  }
  
  return results;
}

/**
 * Check if a credential exists
 * @param key The credential key to check
 * @returns True if the credential exists, false otherwise
 */
export async function hasCredential(key: string): Promise<boolean> {
  const value = await getCredential(key);
  return value !== null && value !== '';
} 