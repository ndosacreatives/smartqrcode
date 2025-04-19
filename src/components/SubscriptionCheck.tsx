import React from 'react';
import Link from 'next/link';
import { SubscriptionTier } from '@/lib/types';
import { hasFeatureAccess } from '@/lib/subscriptions';

interface SubscriptionCheckProps {
  userSubscription: SubscriptionTier;
  feature: string;
  children: React.ReactNode;
  showUpgradeLink?: boolean;
  customMessage?: string;
}

/**
 * A component that conditionally renders its children based on subscription access
 * @param userSubscription - The user's current subscription tier
 * @param feature - The feature to check access for
 * @param children - The content to render if the user has access
 * @param showUpgradeLink - Whether to show an upgrade link if access is denied
 * @param customMessage - Optional custom message to show if access is denied
 */
export default function SubscriptionCheck({
  userSubscription,
  feature,
  children,
  showUpgradeLink = false,
  customMessage,
}: SubscriptionCheckProps) {
  const hasAccess = hasFeatureAccess(userSubscription, feature as any);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center space-x-2 mb-3">
        <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900">Premium Feature</h3>
      </div>
      
      <p className="text-gray-600 mb-4">
        {customMessage || `This feature requires a higher subscription tier than your current "${userSubscription}" plan.`}
      </p>
      
      {showUpgradeLink && (
        <Link href="/pricing" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150">
          Upgrade Subscription
        </Link>
      )}
    </div>
  );
} 