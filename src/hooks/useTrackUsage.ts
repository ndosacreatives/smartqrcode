import { useState } from 'react';
import { useAuth } from '@/context/FirebaseAuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { FeatureType } from '@/lib/subscription';

/**
 * Hook for tracking feature usage
 */
export function useTrackUsage() {
  const { user } = useAuth();
  // Use type assertion to resolve TypeScript error
  const subscription = useSubscription() as any;
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Track usage of a specific feature
   * @param feature Feature being used
   * @param amount Amount to increment (default: 1)
   * @returns Promise resolving to success status
   */
  const trackUsage = async (feature: FeatureType, amount: number = 1): Promise<boolean> => {
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
    // This prevents unnecessary API calls and provides immediate feedback
    if (!subscription.isWithinUsageLimit(feature, amount)) {
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
  };

  // Helper to safely get remaining usage
  const getRemaining = (feature: FeatureType): number => {
    try {
      if (!feature) return 0;
      
      const limitKey = featureLimitMap[feature];
      if (!limitKey) return 0;
      
      return subscription.getLimit(limitKey) || 0;
    } catch (error) {
      console.error("Error getting remaining usage:", error);
      return 0;
    }
  };

  return {
    trackUsage,
    isTracking,
    error,
    // Check if can use feature (using local state data)
    canUseFeature: (feature: string): boolean => {
      try {
        console.log(`canUseFeature called for: ${feature}`);
        console.log(`Current subscription tier: ${subscription.subscriptionTier}`);
        
        if (!feature) return false;
        
        // For permission-based features like "pdfDownload", "svgDownload", "noWatermark", 
        // ALWAYS delegate to subscription.canUseFeature directly
        if (feature === "pdfDownload" || feature === "svgDownload" || feature === "noWatermark") {
          console.log(`Delegating permission-based feature to subscription.canUseFeature: ${feature}`);
          const result = subscription.canUseFeature(feature);
          console.log(`Result from subscription.canUseFeature: ${result}`);
          return result;
        }
        
        // For other non-FeatureType feature names, delegate to subscription's canUseFeature
        if (!(feature in featureLimitMap)) {
          console.log(`Delegating to subscription.canUseFeature for: ${feature}`);
          const result = subscription.canUseFeature(feature);
          console.log(`Result from subscription.canUseFeature: ${result}`);
          return result;
        }
        
        // For standard usage-based features, check remaining usage
        console.log(`Checking remaining usage for: ${feature}`);
        const remaining = getRemaining(feature as FeatureType);
        console.log(`Remaining usage: ${remaining}`);
        return remaining > 0;
      } catch (error) {
        console.error("Error in canUseFeature:", error);
        return false;
      }
    },
    // Get remaining usage for a feature (using local state data)
    getRemainingUsage: (feature?: FeatureType): number => {
      if (!feature) return 0;
      return getRemaining(feature);
    },
    // Check if a specified amount is within the usage limit
    isWithinUsageLimit: (feature: string, amount: number = 1): boolean => {
      try {
        if (!feature) return false;
        
        // For permission-based features, delegate to subscription.canUseFeature
        if (feature === "pdfDownload" || feature === "svgDownload" || feature === "noWatermark") {
          return subscription.canUseFeature(feature);
        }
        
        // For non-FeatureType feature names or direct limit keys
        if (!(feature in featureLimitMap)) {
          // For custom features or direct limit keys, delegate to subscription's isWithinUsageLimit
          return subscription.isWithinUsageLimit(feature, amount);
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
    }
  };
}

// Mapping of feature types to their limit properties
const featureLimitMap: Record<FeatureType, any> = {
  qrCodesGenerated: 'qrGenerationLimit',
  barcodesGenerated: 'barcodeGenerationLimit',
  bulkGenerations: 'bulkGenerationLimit',
  aiCustomizations: 'aiCustomizationLimit',
  noWatermark: 'noWatermark',
  svgDownload: 'svgDownload',
  pdfDownload: 'pdfDownload'
}; 