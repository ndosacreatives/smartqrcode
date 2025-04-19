# Firebase Setup for SmartQRCode App

This document provides instructions for setting up Firebase services for the SmartQRCode application.

## Required Firebase Services

SmartQRCode uses the following Firebase services:

1. **Firebase Authentication** - For user authentication
2. **Firestore** - For storing user data, QR codes, and application settings
3. **Realtime Database** - For real-time features like online status and scan statistics
4. **Storage** - For storing QR code images, user profile pictures, and other assets
5. **Firebase Hosting** - For hosting the web application
6. **Firebase Functions** - For server-side operations

## Setup Steps

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click on "Add project"
3. Follow the setup wizard to create your project
4. Enable Google Analytics if needed

### 2. Set Up Authentication

1. In the Firebase Console, go to Authentication
2. Enable the following authentication methods:
   - Email/Password
   - Google (optional)

### 3. Set Up Firestore

1. Go to Firestore Database in the Firebase Console
2. Create a database in the region closest to your users
3. Start in production mode
4. Deploy the firestore rules from this repository:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Deploy the firestore indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```

### 4. Set Up Realtime Database

1. Go to Realtime Database in the Firebase Console
2. Create a database in the region closest to your users
3. Start in locked mode
4. Deploy the database rules:
   ```bash
   firebase deploy --only database
   ```

### 5. Set Up Storage

1. Go to Storage in the Firebase Console
2. Initialize storage in the region closest to your users
3. Deploy the storage rules:
   ```bash
   firebase deploy --only storage
   ```
4. Set up lifecycle rules for temporary uploads (recommended 7-day expiration)

### 6. Set Up Functions

1. Initialize Firebase Functions in your local environment:
   ```bash
   firebase init functions
   ```
2. Deploy the functions:
   ```bash
   firebase deploy --only functions
   ```

### 7. Configure Web App

1. In the Firebase Console, go to Project Settings
2. Under "Your apps", add a Web app
3. Register the app with a nickname (e.g., "SmartQRCode Web")
4. Copy the Firebase configuration (apiKey, authDomain, etc.)
5. Update your `.env.local` file with these values

### 8. Deploy to Firebase Hosting

1. Build your Next.js app:
   ```bash
   npm run build
   ```
2. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```

## Security Rules

This repository includes the following security rules:

- `firestore.rules` - Rules for Firestore
- `storage.rules` - Rules for Firebase Storage
- `database.rules.json` - Rules for Realtime Database

These rules are configured to:
- Protect user data
- Allow public access to specific content
- Ensure admin-only access to sensitive operations
- Allow user-specific access to their own data

## Admin Setup

To set up an admin user:

1. Create a normal user account
2. Go to Firestore and update the user document:
   ```
   users/{userId}
   ```
3. Add the field `role` with the value `admin`

## Emulators

For local development, you can use Firebase Emulators:

```bash
firebase emulators:start
```

This will start emulators for all configured services, accessible via the Emulator UI (usually at http://localhost:4000).

## Troubleshooting

- If you encounter permission issues, check the security rules and make sure they match your data structure
- For issues with authentication, verify the authentication methods are properly enabled
- For deployment issues, check the Firebase CLI output for specific error messages 