"use client";

import React, { useState, useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useTrackUsage } from '@/hooks/useTrackUsage';
import { hasFeatureAccess } from '@/lib/subscription';
import { featureAccess } from '@/lib/subscription';

export default function SubscriptionTest() {
  const [results, setResults] = useState<any>({});
  
  // Get subscription and trackUsage hooks
  const subscription = useSubscription() as any;
  const { canUseFeature: trackCanUseFeature } = useTrackUsage();
  
  // Features to test
  const featuresToTest = [
    "noWatermark",
    "svgDownload",
    "pdfDownload"
  ];
  
  // Test subscription tier
  const testTier = subscription.subscriptionTier;
  
  // Check feature types validity
  const checkFeatureTypes = () => {
    // Check if featuresToTest exist in all subscription tiers
    const tiers = ['free', 'pro', 'business'];
    const featureTypeResults: Record<string, Record<string, boolean>> = {};
    
    for (const tier of tiers) {
      featureTypeResults[tier] = {};
      const tierFeatures = featureAccess[tier as keyof typeof featureAccess];
      
      for (const feature of featuresToTest) {
        featureTypeResults[tier][feature] = feature in tierFeatures;
      }
    }
    
    return featureTypeResults;
  };
  
  useEffect(() => {
    // Run all tests
    const testResults: any = {
      tier: testTier,
      featureTypeCheck: checkFeatureTypes(),
      directAccess: {},
      subscriptionHook: {},
      trackUsageHook: {}
    };
    
    // Test direct access through hasFeatureAccess
    for (const feature of featuresToTest) {
      testResults.directAccess[feature] = hasFeatureAccess(testTier, feature as any);
    }
    
    // Test through subscription.canUseFeature
    for (const feature of featuresToTest) {
      try {
        testResults.subscriptionHook[feature] = subscription.canUseFeature(feature);
      } catch (err) {
        testResults.subscriptionHook[feature] = `ERROR: ${(err as Error).message}`;
      }
    }
    
    // Test through trackUsage.canUseFeature
    for (const feature of featuresToTest) {
      try {
        testResults.trackUsageHook[feature] = trackCanUseFeature(feature);
      } catch (err) {
        testResults.trackUsageHook[feature] = `ERROR: ${(err as Error).message}`;
      }
    }
    
    setResults(testResults);
  }, [testTier, subscription, trackCanUseFeature]);
  
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-300 rounded my-4">
      <h2 className="text-lg font-bold mb-3">Subscription Permission Test</h2>
      
      <div className="mb-3">
        <strong>Current Subscription Tier:</strong> {testTier || 'Loading...'}
      </div>
      
      <h3 className="font-semibold mt-2 mb-1">Feature Type Validation:</h3>
      <pre className="bg-white p-2 rounded text-sm overflow-x-auto">
        {JSON.stringify(results.featureTypeCheck, null, 2)}
      </pre>
      
      <h3 className="font-semibold mt-2 mb-1">Direct Access Test:</h3>
      <pre className="bg-white p-2 rounded text-sm overflow-x-auto">
        {JSON.stringify(results.directAccess, null, 2)}
      </pre>
      
      <h3 className="font-semibold mt-3 mb-1">Subscription Hook Test:</h3>
      <pre className="bg-white p-2 rounded text-sm overflow-x-auto">
        {JSON.stringify(results.subscriptionHook, null, 2)}
      </pre>
      
      <h3 className="font-semibold mt-3 mb-1">TrackUsage Hook Test:</h3>
      <pre className="bg-white p-2 rounded text-sm overflow-x-auto">
        {JSON.stringify(results.trackUsageHook, null, 2)}
      </pre>
      
      <div className="mt-4 text-sm">
        <p><strong>Note:</strong> All tests should return <code>true</code> for features that should be accessible with your current subscription tier.</p>
      </div>
    </div>
  );
} 