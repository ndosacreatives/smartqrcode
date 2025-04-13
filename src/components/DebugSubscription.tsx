"use client";

import React from 'react';
// import { useSubscription } from '@/hooks/useSubscription';
// import { useTrackUsage } from '@/hooks/useTrackUsage';
// import { useAuth } from '@/context/FirebaseAuthContext';
// import { hasFeatureAccess } from '@/lib/subscription';

export default function DebugSubscription() {
  // Temporarily disabled for debugging
  return (
    <div className="p-4 border border-red-300 bg-red-50 rounded-md my-4">
      <h2 className="text-lg font-bold mb-2">Subscription Debug</h2>
      <p>Debug component temporarily disabled</p>
    </div>
  );

  /*
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
      
      <div className="grid grid-cols-2 gap-2">
        {features.map(feature => (
          <div key={feature} className="flex justify-between border p-2 rounded">
            <span>{feature}:</span>
            <span className={trackCanUseFeature(feature) ? "text-green-600" : "text-red-600"}>
              {trackCanUseFeature(feature) ? "✓" : "✗"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
  */
} 