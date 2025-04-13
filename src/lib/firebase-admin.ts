import admin from 'firebase-admin';

// Initialize Firebase Admin SDK only if it hasn't been initialized yet
if (!admin.apps.length) {
  try {
    // Check if we have direct environment variables for service account
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_CLIENT_EMAIL && 
        process.env.FIREBASE_PRIVATE_KEY) {
      
      console.log('Initializing Firebase Admin with environment variables...');
      
      // Initialize with environment variables
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // The private key comes as a string with "\n" characters
          // We need to replace them with actual newlines
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
      
      console.log('Firebase Admin SDK initialized with environment variables.');
    } 
    // Fallback to application default credentials if available
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('Initializing Firebase Admin with application default credentials...');
      
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      
      console.log('Firebase Admin SDK initialized with application default credentials.');
    }
    // Last resort - try to initialize with a service account directly from code
    else {
      console.log('Attempting to initialize Firebase Admin with default configuration...');
      
      // This is risky and should be replaced with proper credentials in production
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: "firebase-adminsdk-9hq6c@smartqrdatabase-b5076.iam.gserviceaccount.com",
          privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDHrQrFdFq2Kgnj\nBgJvwYpHoIJPi07qlww+z3a90K5NtOdOsahRDIXzlLJvUMFJYzLmaNXPpWODlJ6F\nKF8SVwCeZGEf65c1MqOLJjqEfvPEZKEzRrVcqcSuofAWbNbDvxO/z+M9FESYPsjX\nRTqmCEUYt4EV6sZ+bMGp/4nHRzOC6aMAC8vQ1ySUdPZ/oo2+gM76cK2VLPS+UJJ1\n8DkHLVbXRDfT58JCtkZZQlcGdN+YBT6YV9z5GGJb8sRu1o8M3TtgD4gHlAeBmIKe\nbbHjmZjvn8ULR3OeP3Pj8zMxGYuT3VSq2H8kMpLRv/oYt6b8QE0o9Xdd9KGHF5S6\nGMU78qnTAgMBAAECggEAAIfqjJQDCCRs7b2YD0lC9A3qWsEHSJJvARG3Q7xYpvz7\nAYGXu4Ld6JZvbITU+9YYcDOo3n+xZmUxbcYLIUzHQ2wHWOBsb/91/hIHnPUF6hVq\nEzdxoOkIGOB+IlVGgShjTtXtxz/psjHp9tIpYDOZ9jJ2T9Vh61zK7qNEBPCKjxWG\nwOzDnchXQsIcl8W3U0nLrv8ydoG+3svk3TDwgMQw6kGsf36E/0nE9Nd8BqeaqDxP\nWHZ/KGr33H5/RNkjPYssTBkIW0N+XauY1RyIjBkc6t/F2yjHBDp8w1+qPaUPCUd+\n5z8Dy0+iXvuHqEPzWmkITVYwYHJyBYoq1xTqiUrdkQKBgQDo3l4pGj6azaM2GnPQ\nDXpfSNnZGcQswgjMYx5FafxfVhAsjnhD7V+KRrREkVOQ5dHWXtfRyW4QffOEqV8l\n+1cSZ6JL2aMO0x3LJ6YJ0GDZM+NnJH0aWNsf5Y9Yz2nDLOgvFQvA9Y3A1RXJJiBC\n+0fR7q3Q7W/JDvqb3NiqiL4f6QKBgQDa1EWsjX90MLnOJTYrCfbVW27HssBpn/2Q\nP6jFQzuNzIbzNDMoaFQJbtcgLOzSPbAB9QVZcjMgr25Buc3nJCaMbhZUhUTXqnVS\nK//uMMYbGevNR9e6CETrx0XYwl2bHmCxA2vTOJrGLORYMfL9qLYSMEDuD22S7D1/\naSZRUPkiuwKBgQDFUFsJeqVTKXoiOr/SYjCy+Hk8VtQVJ3uIEMMsYBpUm/FsFCPY\nYHjC5Qr3pQR6+9NQKxAuX9r0+Vh54Yo5OmDNPAFYp+KCnZX5P8BvlV4Pk8nZAQTK\nNwrP2HcDsaRJvIXKHgcgkW/LPRiGqzypxVLzaQ1JO8nIc+8Zp/bXcMCHAQKBgArs\nN8C7r0V0lPwQ0SijSx9ZU1UBG8pF0Iou5bqmZtwSn0wd5KvuO6vLPQIY3W+k2ujJ\nWfZjrDfr2Xrw3wQkDWb0rRmM9UiKXOyoE9SmQaA4QFHQfSFcJFWBY8c9oAqgJnG5\nF8OfafjUbfLmqYBdkYjZHBZfBILDVK0VZf0O8VHpAoGANDaGDqjEbQIbZJJgQVVi\nWO9X75nY9mCXy0YIkK8zrWI2lVXK/o2aLUcLk06EcHr9b0GZJzCBOPwZZfIKkx5u\nXlIyKvZLdw1VJmklMX7xVRRx9I13NNmtpBrCYs4ImuHnZzFbQEXQG/mKAoQRu3cB\nvRHaRrg+UKW8mWCkCg3/VaU=\n-----END PRIVATE KEY-----\n"
        })
      });
      
      console.warn('SECURITY WARNING: Using embedded service account credentials. ' +
                   'This is not recommended for production. ' +
                   'Please set proper environment variables.');
    }
  } catch (error: any) {
    console.error('Firebase Admin SDK Initialization Error:', error);
    // Log the specific error details to help with debugging
    if (error && error.message) {
      console.error('Error Message:', error.message);
    }
    if (error && error.code) {
      console.error('Error Code:', error.code);
    }
    if (error && error.stack) {
      console.error('Error Stack:', error.stack);
    }
  }
} else {
  // If already initialized (e.g., due to hot-reloading in dev), get the default app
  console.log('Firebase Admin SDK already initialized');
  admin.app(); 
}

// Export admin services
const adminDb = admin.firestore();
const adminAuth = admin.auth();

// Add some diagnostic checks to verify the initialization
try {
  // Attempt to access Firestore to verify it's working
  adminDb.collection('_test_').doc('_test_').get()
    .then(() => console.log('Firestore connection verified'))
    .catch(err => console.error('Firestore connection test failed:', err));
  
  // Attempt to list users to verify Auth is working
  adminAuth.listUsers(1)
    .then(() => console.log('Firebase Auth connection verified'))
    .catch(err => console.error('Firebase Auth connection test failed:', err));
} catch (error) {
  console.error('Error during Admin SDK verification:', error);
}

export { adminDb, adminAuth }; 