"use client";

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase/config';

export default function ApiAdminSetupPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get current user
  useEffect(() => {
    const auth = getAuth(app);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email);
      } else {
        setUserId(null);
        setUserEmail(null);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const makeAdmin = async () => {
    if (!userId) {
      setStatus('You must be logged in to perform this action');
      return;
    }
    
    try {
      setProcessing(true);
      setStatus('Processing...');
      
      // Call the API endpoint
      const response = await fetch('/api/admin/make-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email: userEmail
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('Success! ' + data.message);
      } else {
        setStatus('Error: ' + (data.error || 'Unknown error occurred'));
      }
    } catch (err) {
      console.error('Error making user admin:', err);
      setStatus(`Error: ${err instanceof Error ? err.message : 'Failed to make user admin'}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!userId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">API Admin Setup</h1>
        <div className="bg-yellow-50 p-4 rounded">
          <p>You must be logged in to use this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Admin Setup</h1>
      
      <div className="bg-white shadow rounded p-6 mb-6">
        <div className="mb-4">
          <p><strong>User ID:</strong> {userId}</p>
          <p><strong>Email:</strong> {userEmail}</p>
        </div>
        
        <button
          onClick={makeAdmin}
          disabled={processing}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {processing ? 'Processing...' : 'Make Me Admin'}
        </button>
        
        {status && (
          <div className={`mt-4 p-4 rounded ${status.includes('Success') ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className={status.includes('Success') ? 'text-green-700' : 'text-red-700'}>
              {status}
            </p>
          </div>
        )}
      </div>
      
      <div className="bg-yellow-50 p-4 rounded">
        <h3 className="font-bold">How This Works:</h3>
        <p>This page uses a server-side API endpoint to update your user role to admin.</p>
        <p className="mt-2">Benefits of this approach:</p>
        <ul className="list-disc pl-6 mt-1">
          <li>Avoids Firestore persistence issues in the browser</li>
          <li>Uses a separate Firebase instance</li>
          <li>Server-side operation is more reliable</li>
        </ul>
        <p className="mt-2">After becoming an admin, sign out and sign back in for the changes to take effect.</p>
      </div>
    </div>
  );
} 