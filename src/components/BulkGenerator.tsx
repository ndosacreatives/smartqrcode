import React, { useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import SubscriptionCheck from './SubscriptionCheck';
import { useRouter } from 'next/navigation';
import { hasFeatureAccess, getFeatureLimit } from '../lib/subscriptions';
import { useAuth } from "@/context/FirebaseAuthContext";

export default function BulkGenerator() {
  const [qrCodes, setQrCodes] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [numCodes, setNumCodes] = useState(5);
  const { subscriptionTier, loading } = useSubscription();
  const router = useRouter();
  const { user } = useAuth();
  
  // Get limits based on subscription tier
  const maxBulkItems = getFeatureLimit(subscriptionTier, 'maxBulkItems');
  const canAccessBulk = hasFeatureAccess(subscriptionTier, 'bulkGenerationAllowed');

  const handleGenerateBulk = () => {
    if (!canAccessBulk) {
      router.push('/pricing');
      return;
    }
    
    // Ensure we don't exceed the subscription limit
    const codesToGenerate = Math.min(numCodes, maxBulkItems);
    
    // Demo function to simulate generating multiple QR codes
    const newCodes = [];
    for (let i = 0; i < codesToGenerate; i++) {
      // In a real implementation, this would call your QR code generation library
      newCodes.push(`QR Code for: ${inputText} - ${i + 1}`);
    }
    setQrCodes(newCodes);
  };

  if (loading) {
    return <div className="p-6 bg-white rounded-lg shadow-md animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-32 bg-gray-200 rounded w-full"></div>
    </div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Bulk QR Code Generator</h2>
        
        {/* Subscription tier badge */}
        <span className={`text-sm px-3 py-1 rounded-full ${
          subscriptionTier === 'free' ? 'bg-gray-100 text-gray-800' : 
          subscriptionTier === 'pro' ? 'bg-blue-100 text-blue-800' : 
          'bg-purple-100 text-purple-800'
        }`}>
          {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}
        </span>
      </div>
      
      {/* Use SubscriptionCheck to conditionally render based on subscription */}
      <SubscriptionCheck
        userSubscription={subscriptionTier}
        feature="bulkGenerationAllowed"
        showUpgradeLink={true}
        customMessage={`Bulk generation is available on Pro and Business plans. Generate up to ${getFeatureLimit('pro', 'maxBulkItems')} QR codes at once with Pro, or ${getFeatureLimit('business', 'maxBulkItems')} with Business.`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Base Content</label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter content for QR codes"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Number of Codes (Max: {maxBulkItems})
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                value={numCodes}
                onChange={(e) => setNumCodes(parseInt(e.target.value))}
                min="1"
                max={maxBulkItems}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="font-medium text-gray-700 min-w-[2rem] text-center">{numCodes}</span>
            </div>
          </div>
          
          <div className="pt-2">
            <button
              onClick={handleGenerateBulk}
              disabled={!inputText}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Generate {numCodes} QR Codes
            </button>
          </div>
          
          {qrCodes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Generated QR Codes:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {qrCodes.map((code, index) => (
                  <div key={index} className="p-4 border rounded-md">
                    <div className="w-full h-32 bg-gray-200 flex items-center justify-center mb-2">
                      {/* In a real app, this would be an actual QR code image */}
                      QR Image
                    </div>
                    <p className="text-sm text-gray-700 truncate">{code}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SubscriptionCheck>
    </div>
  );
} 