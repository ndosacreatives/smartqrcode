"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/FirebaseAuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { 
  FeatureType, 
  hasFeatureAccess, 
  hasReachedLimit, 
  getRemainingUsage,
  SubscriptionTier
} from '@/lib/subscription';
import { UsageStats } from '@/lib/usage-tracker';
import { UserData } from '@/lib/types';

type SubscriptionContextType = {
  tier: SubscriptionTier;
  usageStats: UsageStats | null;
  hasFeatureAccess: (feature: FeatureType) => boolean;
  hasReachedLimit: (feature: FeatureType) => boolean;
  getRemainingUsage: (feature: FeatureType) => { daily: number; monthly: number };
  isLoading: boolean;
};

const defaultUsageStats: UsageStats = {
  features: {}
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  tier: 'free',
  usageStats: defaultUsageStats,
  hasFeatureAccess: () => false,
  hasReachedLimit: () => true,
  getRemainingUsage: () => ({ daily: 0, monthly: 0 }),
  isLoading: true,
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [usageStats, setUsageStats] = useState<UsageStats | null>(defaultUsageStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    
    let unsubscribe: Unsubscribe | null = null;
    
    if (user?.uid) {
      const userDocRef = doc(db, 'users', user.uid);
      
      unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          // Get subscription tier
          setTier(userData.subscriptionTier || 'free');
          // Get usage stats
          setUsageStats(userData.usageStats || defaultUsageStats);
        } else {
          // Default to free tier if user doc doesn't exist
          setTier('free');
          setUsageStats(defaultUsageStats);
        }
        setIsLoading(false);
      }, (error) => {
        console.error("Error getting user subscription data:", error);
        setTier('free');
        setUsageStats(defaultUsageStats);
        setIsLoading(false);
      });
    } else {
      // No user logged in, default to free tier
      setTier('free');
      setUsageStats(defaultUsageStats);
      setIsLoading(false);
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const checkFeatureAccess = (feature: FeatureType): boolean => {
    return hasFeatureAccess(tier, feature);
  };

  const checkHasReachedLimit = (feature: FeatureType): boolean => {
    if (!usageStats) return true;
    
    return hasReachedLimit(tier, feature, {
      daily: usageStats.features[feature]?.daily.count || 0,
      monthly: usageStats.features[feature]?.monthly.count || 0
    });
  };

  const getRemaining = (feature: FeatureType) => {
    if (!usageStats) return { daily: 0, monthly: 0 };
    
    return getRemainingUsage(tier, feature, {
      daily: usageStats.features[feature]?.daily.count || 0,
      monthly: usageStats.features[feature]?.monthly.count || 0
    });
  };

  const value = {
    tier,
    usageStats,
    hasFeatureAccess: checkFeatureAccess,
    hasReachedLimit: checkHasReachedLimit,
    getRemainingUsage: getRemaining,
    isLoading,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 