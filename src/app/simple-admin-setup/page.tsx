"use client";

import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase-simple';

export default function SimpleAdminSetupPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email);
        
        // Check current role
        const getUserRole = async () => {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              setRole(userDoc.data().role || 'user');
            } else {
              setRole('No user document');
            }
          } catch (err) {
            console.error('Error checking user role:', err);
            setStatus('Error checking your role. Please check console.');
          } finally {
            setLoading(false);
          }
        };
        
        getUserRole();
      } else {
        setUserId(null);
        setUserEmail(null);
        setRole(null);
        setLoading(false);
      }
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
      
      // Create or update the user document
      await setDoc(doc(db, 'users', userId), {
        role: 'admin',
        email: userEmail,
        updatedAt: Timestamp.now()
      }, { merge: true });
      
      setRole('admin');
      setStatus('Success! You are now an admin. Please sign out and sign back in for changes to take effect.');
    } catch (err) {
      console.error('Error making user admin:', err);
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
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
        <h1 className="text-2xl font-bold mb-4">Simple Admin Setup</h1>
        <div className="bg-yellow-50 p-4 rounded">
          <p>You must be logged in to use this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Admin Setup</h1>
      
      <div className="bg-white shadow rounded p-6 mb-6">
        <div className="mb-4">
          <p><strong>User ID:</strong> {userId}</p>
          <p><strong>Email:</strong> {userEmail}</p>
          <p><strong>Current Role:</strong> {role || 'Unknown'}</p>
        </div>
        
        {role === 'admin' ? (
          <div className="bg-green-50 p-4 rounded">
            <p className="text-green-700">You already have admin privileges!</p>
          </div>
        ) : (
          <button
            onClick={makeAdmin}
            disabled={processing}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Make Me Admin'}
          </button>
        )}
        
        {status && (
          <div className={`mt-4 p-4 rounded ${status.includes('Success') ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className={status.includes('Success') ? 'text-green-700' : 'text-red-700'}>
              {status}
            </p>
          </div>
        )}
      </div>
      
      <div className="bg-yellow-50 p-4 rounded">
        <h3 className="font-bold">Important Note:</h3>
        <p>This page uses a simplified Firebase setup that doesn't use persistence, which should avoid the internal errors.</p>
        <p className="mt-2">After becoming an admin, sign out and sign back in for the changes to take effect.</p>
      </div>
    </div>
  );
} 