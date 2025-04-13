import { useEffect, useState } from 'react';
import { useAuth } from '@/context/FirebaseAuthContext';
import { getUserData } from '@/lib/firestore';
import { SubscriptionTier, hasFeatureAccess, subscriptionLimits } from '@/lib/subscription';

interface UseSubscriptionReturn {
  subscriptionTier: SubscriptionTier;
  loading: boolean;
  error: Error | null;
  canAccess: (feature: string) => boolean;
  getLimit: (feature: string) => number;
  isWithinUsageLimit: (feature: string, usage: number) => boolean;
}

/**
 * Hook to access the current user's subscription details and check feature access
 */
export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setSubscriptionTier('free');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userData = await getUserData(user.uid);
        if (userData && userData.subscriptionTier) {
          setSubscriptionTier(userData.subscriptionTier as SubscriptionTier);
        } else {
          setSubscriptionTier('free');
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch subscription'));
        setSubscriptionTier('free'); // Default to free if there's an error
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  // Check if user can access a feature
  const canAccess = (feature: string): boolean => {
    return hasFeatureAccess(subscriptionTier, feature as any);
  };

  // Get the limit for a feature
  const getLimit = (feature: string): number => {
    const tierLimits = subscriptionLimits[subscriptionTier];
    const limitKey = feature as keyof typeof tierLimits;
    const limit = tierLimits[limitKey];
    return typeof limit === 'object' ? limit.daily : 0;
  };

  // Check if usage is within the limit
  const isWithinUsageLimit = (feature: string, usage: number): boolean => {
    const limit = getLimit(feature);
    return usage < limit;
  };

  return {
    subscriptionTier,
    loading,
    error,
    canAccess,
    getLimit,
    isWithinUsageLimit
  };
} 