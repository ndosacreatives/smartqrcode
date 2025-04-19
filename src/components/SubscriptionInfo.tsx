"use client";

import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import Link from 'next/link';

export default function SubscriptionInfo() {
  const { 
    subscriptionTier, 
    loading,
    getLimit,
    featuresUsage,
    error
  } = useSubscription();

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg w-full"></div>;
  }
  
  if (error) {
    // Show a warning instead of an error since we're falling back to defaults
    return <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
      {error}
    </div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Your Subscription</h2>
        <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
          {subscriptionTier}
        </span>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">QR Codes Generated</h3>
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ 
                  width: `${Math.min(100, (featuresUsage.qrCodesGenerated / getLimit('qrGenerationLimit')) * 100)}%` 
                }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700 ml-2">
              {featuresUsage.qrCodesGenerated} / {getLimit('qrGenerationLimit')}
            </span>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Barcodes Generated</h3>
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ 
                  width: `${Math.min(100, (featuresUsage.barcodesGenerated / getLimit('barcodeGenerationLimit')) * 100)}%` 
                }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700 ml-2">
              {featuresUsage.barcodesGenerated} / {getLimit('barcodeGenerationLimit')}
            </span>
          </div>
        </div>
        
        {getLimit('bulkGenerationLimit') > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Bulk Generations</h3>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, (featuresUsage.bulkGenerations / getLimit('bulkGenerationLimit')) * 100)}%` 
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700 ml-2">
                {featuresUsage.bulkGenerations} / {getLimit('bulkGenerationLimit')}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {subscriptionTier === 'free' && (
        <div className="mt-6">
          <Link 
            href="/pricing" 
            className="block text-center w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200"
          >
            Upgrade Your Plan
          </Link>
        </div>
      )}
    </div>
  );
} 