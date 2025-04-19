import crypto from 'crypto';

// Get encryption key from environment variables
const ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY;
const ENCRYPTION_IV = process.env.CREDENTIALS_ENCRYPTION_IV;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.warn('CREDENTIALS_ENCRYPTION_KEY must be 32 characters long for AES-256');
}

if (!ENCRYPTION_IV || ENCRYPTION_IV.length !== 16) {
  console.warn('CREDENTIALS_ENCRYPTION_IV must be 16 characters long for AES-256');
}

/**
 * Encrypts a string using AES-256-CBC
 * @param text Text to encrypt
 * @returns Encrypted text as a hex string with IV
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY || !ENCRYPTION_IV) {
    throw new Error('Encryption keys not configured');
  }
  
  try {
    // Create cipher using the encryption key and initialization vector
    const cipher = crypto.createCipheriv(
      'aes-256-cbc', 
      Buffer.from(ENCRYPTION_KEY), 
      Buffer.from(ENCRYPTION_IV)
    );
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts a string that was encrypted with AES-256-CBC
 * @param encrypted Encrypted text as a hex string with IV
 * @returns Decrypted text
 */
export function decrypt(encrypted: string): string {
  if (!ENCRYPTION_KEY || !ENCRYPTION_IV) {
    throw new Error('Encryption keys not configured');
  }
  
  try {
    // Create decipher using the same key and IV
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc', 
      Buffer.from(ENCRYPTION_KEY), 
      Buffer.from(ENCRYPTION_IV)
    );
    
    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
} 