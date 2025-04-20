"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/FirebaseAuthContext';
import { User } from 'firebase/auth';
import { UserData } from '@/lib/firestore';

export default function AdminHelpPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Get user ID safely regardless of type
  const getUserId = (user: User | UserData | null): string => {
    if (!user) return 'YOUR_USER_ID';
    
    // If it's a Firebase User
    if ('uid' in user) {
      return user.uid;
    }
    
    // If it's a UserData object
    if ('id' in user) {
      return user.id;
    }
    
    return 'YOUR_USER_ID';
  };

  // Create a script that can be pasted in the browser console
  const consoleScript = `
// Admin creation script - run in browser console
(async function() {
  try {
    const db = firebase.firestore();
    const userId = "${getUserId(user)}";
    
    // Update the user document
    await db.collection('users').doc(userId).set({
      role: 'admin',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Success! User is now an admin. Please sign out and sign back in.');
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
  `.trim();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(consoleScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Admin Setup Help</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Use Console Script</h2>
        
        {user ? (
          <div>
            <p className="mb-4">Current User ID: <code className="bg-gray-100 px-2 py-1 rounded">{getUserId(user)}</code></p>
          </div>
        ) : (
          <p className="text-yellow-600 mb-4">You are not logged in. Please log in first.</p>
        )}
        
        <p className="mb-4">Follow these steps to make yourself an admin:</p>
        
        <ol className="list-decimal pl-6 mb-6 space-y-2">
          <li>Log in to your account (if you haven't already)</li>
          <li>Open the browser developer console (F12 or Right-click &gt; Inspect)</li>
          <li>Copy the script below and paste it into the console</li>
          <li>Press Enter to run the script</li>
          <li>Sign out and sign back in to apply the changes</li>
        </ol>
        
        <div className="relative">
          <pre className="bg-gray-800 text-green-400 p-4 rounded-md overflow-x-auto text-sm">
            {consoleScript}
          </pre>
          <button
            onClick={copyToClipboard}
            className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <h3 className="font-bold text-yellow-700">Important Security Warning</h3>
        <p className="text-yellow-700">
          This method is for development purposes only. In production, implement proper admin creation flows with additional authentication.
        </p>
      </div>
    </div>
  );
} 