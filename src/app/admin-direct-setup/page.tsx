"use client";

import React, { useState } from 'react';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminDirectSetupPage() {
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const makeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      setStatus('Please enter a user ID');
      return;
    }
    
    try {
      setProcessing(true);
      setStatus('Processing...');
      
      // Using setDoc with merge to update or create the document
      await setDoc(doc(db, 'users', userId), {
        role: 'admin',
        updatedAt: Timestamp.now()
      }, { merge: true });
      
      setStatus('Success! User is now an admin. Please sign out and sign back in for changes to take effect.');
    } catch (err) {
      console.error('Error making user admin:', err);
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Direct Admin Setup</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <form onSubmit={makeAdmin}>
          <div className="mb-4">
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter the Firebase Auth user ID"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Find your user ID in the Firebase Authentication console or check the browser console after logging in.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={processing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Make Admin'}
          </button>
        </form>
        
        {status && (
          <div className={`mt-4 p-4 rounded ${status.includes('Success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {status}
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-500">
          <p className="font-semibold">How to find your User ID:</p>
          <ol className="list-decimal pl-4 mt-2">
            <li>Log in to your account</li>
            <li>Open the browser developer console (F12 or Right-click > Inspect)</li>
            <li>Type this command in the console: <code className="bg-gray-100 px-1">console.log(localStorage.getItem('firebase-auth-token'))</code></li>
            <li>The user ID is in the decoded token (you can use <a href="https://jwt.io/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">jwt.io</a> to decode it)</li>
          </ol>
          
          <p className="font-semibold mt-4">Important Warning:</p>
          <ul className="list-disc pl-4 mt-2">
            <li>This page uses a direct Firestore update and should be deleted after initial setup.</li>
            <li>In production, admin creation should be properly secured with additional authentication.</li>
            <li>After becoming an admin, sign out and sign back in for changes to take effect.</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 