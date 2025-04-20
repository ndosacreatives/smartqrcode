"use client";

import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { AVAILABLE_PROVIDERS } from '@/lib/authProviders';
import { useAuth } from '@/context/FirebaseAuthContext';

export default function DebugAuthPage() {
  const [firebaseConfig, setFirebaseConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [authProviders, setAuthProviders] = useState<any[]>([]);
  const { user, loading } = useAuth();

  useEffect(() => {
    try {
      // Get Firebase config from the auth object
      const config = {
        apiKey: auth.app.options.apiKey?.substr(0, 5) + '...',
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId,
        appId: auth.app.options.appId?.split(':')[1] + '...',
      };
      setFirebaseConfig(config);

      // Get available providers
      const providers = Object.entries(AVAILABLE_PROVIDERS).map(([key, value]) => ({
        name: value.name,
        key,
        enabled: value.enabled,
      }));
      setAuthProviders(providers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Firebase Auth Debug</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Firebase Configuration</h2>
        {error ? (
          <div className="text-red-500">{error}</div>
        ) : firebaseConfig ? (
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(firebaseConfig, null, 2)}
          </pre>
        ) : (
          <div className="animate-pulse h-40 bg-gray-200 rounded"></div>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Auth Providers</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enabled</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {authProviders.map((provider) => (
              <tr key={provider.key}>
                <td className="px-6 py-4 whitespace-nowrap">{provider.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {provider.enabled ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Enabled
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Disabled
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Current User</h2>
        {loading ? (
          <div className="animate-pulse h-40 bg-gray-200 rounded"></div>
        ) : user ? (
          <div>
            <p><strong>User ID:</strong> {user.uid}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Email verified:</strong> {String(user.emailVerified)}</p>
            <p><strong>Display Name:</strong> {user.displayName || 'Not set'}</p>
            <p><strong>Provider ID:</strong> {user.providerId}</p>
            <button 
              onClick={() => auth.signOut()} 
              className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <p>No user is currently signed in.</p>
        )}
      </div>
    </div>
  );
} 