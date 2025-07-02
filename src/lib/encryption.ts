import crypto from 'crypto';

// Get encryption key from environment variables
const ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.warn('CREDENTIALS_ENCRYPTION_KEY must be 32 characters long for AES-256');
}

/**
 * Encrypts a string using AES-256-CBC
 * @param text Text to encrypt
 * @returns Encrypted text as a hex string with IV
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured');
  }
  
  try {
    // Generate a unique IV for this encryption
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Return iv:ciphertext so we can extract the IV during decryption
    return `${iv.toString('hex')}:${encrypted}`;
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
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured');
  }
  
  try {
    const [ivHex, ciphertext] = encrypted.split(':');
    if (!ivHex || !ciphertext) {
      throw new Error('Invalid encrypted format');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
} 