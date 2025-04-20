"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/FirebaseAuthContext';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminSetupPage() {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function checkUserRole() {
      if (user && 'uid' in user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || 'user');
          }
        } catch (err) {
          console.error('Error checking user role:', err);
          setStatus('Error checking your role. See console for details.');
        }
      }
    }
    
    if (user) {
      checkUserRole();
    }
  }, [user]);

  const makeAdmin = async () => {
    if (!user || !('uid' in user)) {
      setStatus('You must be logged in to perform this action');
      return;
    }
    
    try {
      setProcessing(true);
      setStatus('Processing...');
      
      const userDocRef = doc(db, 'users', user.uid);
      
      // Make current user an admin
      await updateDoc(userDocRef, {
        role: 'admin',
        updatedAt: Timestamp.now()
      });
      
      setUserRole('admin');
      setStatus('Success! You are now an admin. Please sign out and sign back in for changes to take effect.');
    } catch (err) {
      console.error('Error making user admin:', err);
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Admin Setup</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Admin Setup</h1>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-yellow-700">You must be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Admin Setup</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Your Account</h2>
        <p><strong>User ID:</strong> {'uid' in user ? user.uid : user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Current Role:</strong> {userRole || 'Loading...'}</p>
        
        {userRole === 'admin' ? (
          <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
            <p className="text-green-700">
              You already have admin privileges!
            </p>
          </div>
        ) : (
          <button
            onClick={makeAdmin}
            disabled={processing}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Make Me Admin'}
          </button>
        )}
        
        {status && (
          <div className={`mt-4 p-4 rounded ${status.includes('Success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {status}
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-500">
          <p className="font-semibold">Important Notes:</p>
          <ul className="list-disc pl-4 mt-2">
            <li>After becoming an admin, you should sign out and sign back in.</li>
            <li>This page is for demonstration purposes and should be properly secured in production.</li>
            <li>For security reasons, the admin setup functionality should be protected with additional authentication in a real application.</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 