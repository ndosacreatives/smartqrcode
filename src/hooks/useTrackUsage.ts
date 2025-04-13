import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/FirebaseAuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { FeatureType } from '@/lib/subscription';

/**
 * Hook for tracking feature usage
 */
export function useTrackUsage() {
  const { user } = useAuth();
  const subscription = useSubscription();
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize the access to subscription properties to prevent render loops
  const subscriptionTier = useMemo(() => subscription?.tier || 'free', [subscription?.tier]);
  const usageStats = useMemo(() => subscription?.usageStats || null, [subscription?.usageStats]);

  // Helper to safely get remaining usage - memoized to prevent render loops
  const getRemaining = useCallback((feature: FeatureType): number => {
    try {
      if (!feature) return 0;
      
      if (typeof subscription?.getRemainingUsage === 'function') {
        const result = subscription.getRemainingUsage(feature);
        return result.daily || 0;
      }
      
      return 0;
    } catch (error) {
      console.error("Error getting remaining usage:", error);
      return 0;
    }
  }, [subscription]);

  // Memoize the canUseFeature function
  const canUseFeature = useCallback((feature: string): boolean => {
    try {
      if (!feature) return false;
      
      // For all features, use hasFeatureAccess from the context
      if (typeof subscription?.hasFeatureAccess === 'function') {
        return subscription.hasFeatureAccess(feature as FeatureType);
      }
      
      return false;
    } catch (error) {
      console.error("Error in canUseFeature:", error);
      return false;
    }
  }, [subscription]);

  // Memoize the isWithinUsageLimit function
  const isWithinUsageLimit = useCallback((feature: string, amount: number = 1): boolean => {
    try {
      if (!feature) return false;
      
      // For permission-based features
      if (feature === "pdfDownload" || feature === "svgDownload" || feature === "noWatermark") {
        return canUseFeature(feature);
      }
      
      // For other features, check if reached limit
      if (typeof subscription?.hasReachedLimit === 'function') {
        return !subscription.hasReachedLimit(feature as FeatureType);
      }
      
      // Fall back to checking remaining
      const remaining = getRemaining(feature as FeatureType);
      return remaining >= amount;
    } catch (error) {
      console.error("Error in isWithinUsageLimit:", error);
      return false;
    }
  }, [subscription, canUseFeature, getRemaining]);

  // Memoize the trackUsage function
  const trackUsage = useCallback(async (feature: FeatureType, amount: number = 1): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    // Check if feature can be used
    if (!canUseFeature(feature)) {
      setError(`Feature ${feature} is not available on your plan`);
      return false;
    }

    // Check if user has reached limit based on local state first
    if (!isWithinUsageLimit(feature, amount)) {
      setError(`You've reached your ${feature} limit for your current plan`);
      return false;
    }

    try {
      setIsTracking(true);
      setError(null);

      const response = await fetch('/api/usage/track-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature,
          amount,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to track usage');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while tracking usage');
      return false;
    } finally {
      setIsTracking(false);
    }
  }, [user, canUseFeature, isWithinUsageLimit]);

  // Get remaining usage for a feature (using local state data)
  const getRemainingUsage = useCallback((feature?: FeatureType): number => {
    if (!feature) return 0;
    return getRemaining(feature);
  }, [getRemaining]);

  // Return stable object with memoized functions to prevent render loops
  return useMemo(() => ({
    trackUsage,
    isTracking,
    error,
    canUseFeature,
    getRemainingUsage,
    isWithinUsageLimit
  }), [
    trackUsage,
    isTracking,
    error,
    canUseFeature,
    getRemainingUsage,
    isWithinUsageLimit
  ]);
}

// Mapping of feature types to their limit properties
const featureLimitMap: Record<FeatureType, any> = {
  qrCodesGenerated: 'qrGenerationLimit',
  barcodesGenerated: 'barcodeGenerationLimit',
  bulkGenerations: 'bulkGenerationLimit',
  aiCustomizations: 'aiCustomizationLimit',
  noWatermark: 'noWatermark',
  svgDownload: 'svgDownload',
  pdfDownload: 'pdfDownload',
  qrCodeTracking: 'qrCodeTracking',
  enhancedBarcodes: 'enhancedBarcodes',
  fileUploads: 'fileUploads',
  analytics: 'analytics'
}; 