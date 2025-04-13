import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Check if Firebase admin app has been initialized
if (!admin.apps.length) {
  try {
    // Potential locations for the service account file
    const potentialPaths = [
      path.join(process.cwd(), 'firebase-key.json'),
      path.join(process.cwd(), 'src', 'firebase-key.json'),
      path.join(process.cwd(), '.firebase', 'firebase-key.json'),
      path.join(process.cwd(), 'config', 'firebase-key.json'),
    ];
    
    let serviceAccount = null;
    let foundPath = null;
    
    // Try each path until we find the file
    for (const filePath of potentialPaths) {
      if (fs.existsSync(filePath)) {
        serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        foundPath = filePath;
        break;
      }
    }
    
    if (!serviceAccount) {
      console.error('Service account file not found in any of the expected locations');
      console.error('Tried paths:', potentialPaths);
      
      // Fall back to environment variables if available
      if (process.env.FIREBASE_PROJECT_ID && 
          process.env.FIREBASE_CLIENT_EMAIL && 
          process.env.FIREBASE_PRIVATE_KEY) {
        console.log('Using environment variables for Firebase Admin initialization');
        serviceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };
      } else {
        throw new Error('Firebase service account not found and environment variables not set');
      }
    } else {
      console.log(`Found service account at: ${foundPath}`);
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin initialized successfully in lib/firebase-admin');
  } catch (error) {
    console.error('Error initializing Firebase Admin in lib/firebase-admin:', error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();

export default admin.app(); 