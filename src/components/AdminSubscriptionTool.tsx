"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/FirebaseAuthContext';

export default function AdminSubscriptionTool() {
  const { user } = useAuth();
  const [userId, setUserId] = useState<string>('');
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Only render this component for the admin user
  if (!user || user.email !== 'admin@example.com') {
    return null;
  }

  const updateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Use the user's ID if no ID is specified
      const targetId = userId.trim() || user.uid;

      // Call the admin API to update the subscription
      const response = await fetch(`/api/admin/users/${targetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionTier
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update subscription');
      }

      const data = await response.json();
      setMessage(`Successfully updated subscription to ${subscriptionTier}`);
    } catch (err) {
      setError((err as Error).message || 'An error occurred');
      console.error('Error updating subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-red-500 bg-red-50 rounded-md my-4">
      <h2 className="text-lg font-bold mb-2">Admin Subscription Tool</h2>
      <form onSubmit={updateSubscription} className="space-y-4">
        <div>
          <label htmlFor="userId" className="block text-sm font-medium">
            User ID (leave blank for current user)
          </label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="User ID"
          />
        </div>
        
        <div>
          <label htmlFor="tier" className="block text-sm font-medium">
            Subscription Tier
          </label>
          <select
            id="tier"
            value={subscriptionTier}
            onChange={(e) => setSubscriptionTier(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Subscription'}
        </button>
      </form>
      
      {message && (
        <div className="mt-4 p-2 bg-green-100 text-green-800 rounded-md">
          {message}
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        Note: This is an admin-only tool. Changes take effect immediately but might require a page refresh to see.
      </div>
    </div>
  );
} 