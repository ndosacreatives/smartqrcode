import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/FirebaseAuthContext';
import { useSubscription } from '@/context/SubscriptionProvider';
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
  const subscriptionTier = useMemo(() => subscription?.subscriptionTier || 'free', [subscription?.subscriptionTier]);
  const featuresUsage = useMemo(() => subscription?.featuresUsage || {}, [subscription?.featuresUsage]);
  const limits = useMemo(() => subscription?.limits || {}, [subscription?.limits]);

  // Helper to safely get remaining usage - memoized to prevent render loops
  const getRemaining = useCallback((feature: FeatureType): number => {
    try {
      if (!feature) return 0;
      
      const limitKey = featureLimitMap[feature];
      if (!limitKey) return 0;
      
      // Use memoized values instead of directly accessing subscription
      if (typeof subscription?.getLimit === 'function') {
        return subscription.getLimit(limitKey) || 0;
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
      
      // For permission-based features
      if (feature === "pdfDownload" || feature === "svgDownload" || feature === "noWatermark") {
        if (typeof subscription?.canUseFeature === 'function') {
          return subscription.canUseFeature(feature);
        }
        return false;
      }
      
      // For other features
      if (!(feature in featureLimitMap)) {
        if (typeof subscription?.canUseFeature === 'function') {
          return subscription.canUseFeature(feature);
        }
        return false;
      }
      
      // For standard usage-based features, check remaining usage
      const remaining = getRemaining(feature as FeatureType);
      return remaining > 0;
    } catch (error) {
      console.error("Error in canUseFeature:", error);
      return false;
    }
  }, [subscription, getRemaining]);

  // Memoize the isWithinUsageLimit function
  const isWithinUsageLimit = useCallback((feature: string, amount: number = 1): boolean => {
    try {
      if (!feature) return false;
      
      // For permission-based features
      if (feature === "pdfDownload" || feature === "svgDownload" || feature === "noWatermark") {
        return canUseFeature(feature);
      }
      
      // For non-FeatureType feature names or direct limit keys
      if (!(feature in featureLimitMap)) {
        if (typeof subscription?.isWithinUsageLimit === 'function') {
          return subscription.isWithinUsageLimit(feature, amount);
        }
        return false;
      }
      
      // For standard features in featureLimitMap
      const featureType = feature as FeatureType;
      const limitKey = featureLimitMap[featureType];
      if (!limitKey) return false;
      
      // Check against the limit using the feature's limit key
      const remaining = getRemaining(featureType);
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

    // Check if feature exists in the map
    if (!feature || !(feature in featureLimitMap)) {
      setError(`Unknown feature: ${feature}`);
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
  }, [user, isWithinUsageLimit]);

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