"use client";

import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useTrackUsage } from '@/hooks/useTrackUsage';
import { useAuth } from '@/context/FirebaseAuthContext';
import { hasFeatureAccess } from '@/lib/subscription';

export default function DebugSubscription() {
  const { user } = useAuth();
  const subscription = useSubscription() as any;
  const subscriptionTier = subscription.subscriptionTier;
  const subscriptionLoading = subscription.loading;
  const subscriptionError = subscription.error;
  
  const { 
    canUseFeature: trackCanUseFeature
  } = useTrackUsage();
  
  const features = [
    "noWatermark",
    "svgDownload",
    "pdfDownload"
  ];
  
  return (
    <div className="p-4 border border-red-300 bg-red-50 rounded-md my-4">
      <h2 className="text-lg font-bold mb-2">Subscription Debug</h2>
      
      <div className="mb-2">
        <strong>User:</strong> {user ? `${user.email} (${user.uid})` : 'Not logged in'}
      </div>
      
      <div className="mb-2">
        <strong>Subscription Tier:</strong> {subscriptionTier}
      </div>
      
      {subscriptionLoading && <div>Loading subscription data...</div>}
      {subscriptionError && <div className="text-red-500">Error: {String(subscriptionError)}</div>}
      
      <h3 className="font-semibold mt-3 mb-2">Feature Access:</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1">Feature</th>
            <th className="text-left py-1">Direct Check</th>
            <th className="text-left py-1">useSubscription</th>
            <th className="text-left py-1">useTrackUsage</th>
          </tr>
        </thead>
        <tbody>
          {features.map(feature => (
            <tr key={feature} className="border-b">
              <td className="py-1">{feature}</td>
              <td className="py-1">{hasFeatureAccess(subscriptionTier, feature as any) ? '✅' : '❌'}</td>
              <td className="py-1">{subscription.canUseFeature(feature) ? '✅' : '❌'}</td>
              <td className="py-1">{trackCanUseFeature(feature) ? '✅' : '❌'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-4 text-sm text-gray-700">
        <p>If you're experiencing issues with premium features not being available:</p>
        <ol className="list-decimal ml-5">
          <li>Make sure your subscription tier is correctly set in the database</li>
          <li>Check that the canUseFeature function is properly evaluating permissions</li>
          <li>Verify that all three checks in the table above show consistent results</li>
        </ol>
      </div>
    </div>
  );
} 