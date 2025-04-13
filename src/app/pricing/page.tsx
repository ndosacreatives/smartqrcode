"use client";

import React from 'react';
import { subscriptionFeatures, subscriptionPricing, SubscriptionTier } from '@/lib/subscriptions';
import { useAuth } from '@/context/FirebaseAuthContext';
import { useSubscription } from '@/context/SubscriptionProvider';
import { useRouter } from 'next/navigation';
import { updateUserData } from '@/lib/firestore';

export default function PricingPage() {
  const { user } = useAuth();
  const { subscriptionTier, loading } = useSubscription();
  const router = useRouter();

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (!user) {
      router.push('/register?redirect=/pricing');
      return;
    }

    try {
      // In a real app, this would redirect to a checkout page
      // For demo purposes, we'll just update the user's subscription directly
      await updateUserData(user.uid, { subscriptionTier: tier });
      alert(`Subscription upgraded to ${tier} successfully!`);
      
      // In a real app, you might want to redirect to a success page or dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Failed to upgrade subscription. Please try again.');
    }
  };

  const renderFeatures = (tier: SubscriptionTier) => {
    const features = subscriptionFeatures[tier];
    
    return (
      <ul className="mt-6 space-y-4">
        <li className="flex">
          <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="ml-3">{features.maxQRCodes} QR codes</span>
        </li>
        <li className="flex">
          <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="ml-3">{features.maxBarcodes} barcodes</span>
        </li>
        <li className="flex">
          {features.bulkGenerationAllowed ? (
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="ml-3">
            Bulk generation {features.bulkGenerationAllowed ? `(${features.maxBulkItems} items)` : ''}
          </span>
        </li>
        <li className="flex">
          {features.aiCustomizationAllowed ? (
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="ml-3">
            AI customization {features.aiCustomizationAllowed ? `(${features.maxAICustomizations} designs)` : ''}
          </span>
        </li>
        <li className="flex">
          {features.analyticsEnabled ? (
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="ml-3">Analytics</span>
        </li>
        <li className="flex">
          {features.customBrandingAllowed ? (
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="ml-3">Custom branding</span>
        </li>
        <li className="flex">
          {features.teamMembersAllowed ? (
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="ml-3">
            Team members {features.teamMembersAllowed ? `(${features.maxTeamMembers} members)` : ''}
          </span>
        </li>
      </ul>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4">Loading subscription details...</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Choose the plan that fits your needs
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-y-10 gap-x-8 lg:grid-cols-3">
          {/* Free Tier */}
          <div className={`rounded-lg shadow-lg overflow-hidden ${subscriptionTier === 'free' ? 'ring-2 ring-indigo-600' : ''}`}>
            <div className="px-6 py-8 bg-white sm:p-10 sm:pb-6">
              <div>
                <h3 className="text-center text-2xl font-medium text-gray-900">
                  Free
                </h3>
                <div className="mt-4 flex justify-center">
                  <span className="text-5xl font-extrabold text-gray-900">$0</span>
                  <span className="ml-1 text-xl font-medium text-gray-500 self-end">/mo</span>
                </div>
              </div>
            </div>
            <div className="px-6 pt-6 pb-8 bg-gray-50 sm:p-10">
              {renderFeatures('free')}
              <div className="mt-8">
                <button
                  onClick={() => handleUpgrade('free')}
                  disabled={subscriptionTier === 'free'}
                  className={`w-full py-3 px-4 rounded-md shadow ${
                    subscriptionTier === 'free'
                      ? 'bg-gray-100 text-gray-800 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {subscriptionTier === 'free' ? 'Current Plan' : 'Downgrade'}
                </button>
              </div>
            </div>
          </div>

          {/* Pro Tier */}
          <div className={`rounded-lg shadow-lg overflow-hidden ${subscriptionTier === 'pro' ? 'ring-2 ring-indigo-600' : ''}`}>
            <div className="px-6 py-8 bg-white sm:p-10 sm:pb-6">
              <div>
                <h3 className="text-center text-2xl font-medium text-gray-900">
                  Pro
                </h3>
                <div className="mt-4 flex justify-center">
                  <span className="text-5xl font-extrabold text-gray-900">${subscriptionPricing.pro}</span>
                  <span className="ml-1 text-xl font-medium text-gray-500 self-end">/mo</span>
                </div>
              </div>
            </div>
            <div className="px-6 pt-6 pb-8 bg-gray-50 sm:p-10">
              {renderFeatures('pro')}
              <div className="mt-8">
                <button
                  onClick={() => handleUpgrade('pro')}
                  disabled={subscriptionTier === 'pro'}
                  className={`w-full py-3 px-4 rounded-md shadow ${
                    subscriptionTier === 'pro'
                      ? 'bg-gray-100 text-gray-800 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {subscriptionTier === 'pro' ? 'Current Plan' : 
                   subscriptionTier === 'business' ? 'Downgrade' : 'Upgrade'}
                </button>
              </div>
            </div>
          </div>

          {/* Business Tier */}
          <div className={`rounded-lg shadow-lg overflow-hidden ${subscriptionTier === 'business' ? 'ring-2 ring-indigo-600' : ''}`}>
            <div className="px-6 py-8 bg-white sm:p-10 sm:pb-6">
              <div>
                <h3 className="text-center text-2xl font-medium text-gray-900">
                  Business
                </h3>
                <div className="mt-4 flex justify-center">
                  <span className="text-5xl font-extrabold text-gray-900">${subscriptionPricing.business}</span>
                  <span className="ml-1 text-xl font-medium text-gray-500 self-end">/mo</span>
                </div>
              </div>
            </div>
            <div className="px-6 pt-6 pb-8 bg-gray-50 sm:p-10">
              {renderFeatures('business')}
              <div className="mt-8">
                <button
                  onClick={() => handleUpgrade('business')}
                  disabled={subscriptionTier === 'business'}
                  className={`w-full py-3 px-4 rounded-md shadow ${
                    subscriptionTier === 'business'
                      ? 'bg-gray-100 text-gray-800 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {subscriptionTier === 'business' ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 