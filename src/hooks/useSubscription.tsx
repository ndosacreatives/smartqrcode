import { useEffect, useState } from 'react';
import { useAuth } from '../context/FirebaseAuthContext';
import { SubscriptionTier, UserData, UseSubscriptionReturn } from '../lib/types';
import { 
  hasFeatureAccess, 
  getRemainingUsage, 
  hasReachedLimit,
  subscriptionLimits,
  featureAccess
} from '../lib/subscription';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, FirestoreError } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (!user) {
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        console.log("Attempting to fetch user data for:", user.uid);
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          console.log("User data retrieved successfully");
          const data = userSnap.data() as UserData;
          console.log("User subscription tier:", data.subscriptionTier);
          console.log("Full user data:", data);
          setUserData(data);
        } else {
          // If user document doesn't exist, create default user data
          console.log("No user document found, creating default data");
          const defaultUserData = {
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            subscriptionTier: 'free',
            role: 'user',
            featuresUsage: {
              qrCodesGenerated: 0,
              barcodesGenerated: 0,
              bulkGenerations: 0,
              aiCustomizations: 0
            }
          };
          setUserData(defaultUserData as UserData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        
        // Extract more specific error information
        let errorMessage = 'Could not fetch user data, using default settings';
        if (error instanceof FirebaseError || error instanceof FirestoreError) {
          // Provide more specific error messages based on Firebase error codes
          const fbError = error as FirebaseError;
          if (fbError.code === 'permission-denied') {
            errorMessage = 'Firestore permissions error: You do not have access to this data';
          } else if (fbError.code === 'unavailable') {
            errorMessage = 'Firebase service unavailable. Check your connection';
          } else if (fbError.code === 'not-found') {
            errorMessage = 'User document not found';
          } else {
            errorMessage = `Firebase error (${fbError.code}): ${fbError.message}`;
          }
        }
        
        // On error, set default user data instead of failing
        const defaultUserData = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          subscriptionTier: 'free',
          role: 'user',
          featuresUsage: {
            qrCodesGenerated: 0,
            barcodesGenerated: 0,
            bulkGenerations: 0,
            aiCustomizations: 0
          }
        };
        setUserData(defaultUserData as UserData);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user]);

  const subscriptionTier = userData?.subscriptionTier || 'free';
  const featuresUsage = userData?.featuresUsage || {
    qrCodesGenerated: 0,
    barcodesGenerated: 0,
    bulkGenerations: 0,
    aiCustomizations: 0
  };

  return {
    loading,
    error,
    subscriptionTier,
    featuresUsage,
    limits: subscriptionLimits[subscriptionTier as SubscriptionTier],
    getLimit: (featureKey: string) => {
      try {
        const tier = subscriptionTier as SubscriptionTier;
        const tierLimits = subscriptionLimits[tier];
        
        if (!tierLimits) return 0;
        
        const feature = featureKey as keyof typeof subscriptionLimits.free;
        const featureLimits = tierLimits[feature];
        
        if (!featureLimits) return 0;
        
        return featureLimits.daily ?? 0;
      } catch (error) {
        console.error(`Error in getLimit for ${featureKey}:`, error);
        return 0;
      }
    },
    canUseFeature: (feature: string) => {
      console.log(`useSubscription.canUseFeature called for: ${feature}`);
      console.log(`Current tier: ${subscriptionTier}`);
      const result = hasFeatureAccess(subscriptionTier as SubscriptionTier, feature as keyof typeof featureAccess.free);
      console.log(`Result of hasFeatureAccess: ${result}`);
      return result;
    },
    remainingUsage: (feature: string) => {
      const usageKey = {
        qrGenerationLimit: 'qrCodesGenerated',
        barcodeGenerationLimit: 'barcodesGenerated',
        bulkGenerationLimit: 'bulkGenerations',
        aiCustomizationLimit: 'aiCustomizations'
      }[feature] as keyof typeof featuresUsage;
      
      const currentUsage = { 
        daily: featuresUsage[usageKey], 
        monthly: featuresUsage[usageKey] 
      };
      
      const result = getRemainingUsage(
        subscriptionTier as SubscriptionTier,
        feature as any,
        currentUsage
      );
      
      // Return the daily limit
      return result.daily;
    },
    hasReachedLimit: (feature: string) => {
      const usageKey = {
        qrGenerationLimit: 'qrCodesGenerated',
        barcodeGenerationLimit: 'barcodesGenerated',
        bulkGenerationLimit: 'bulkGenerations',
        aiCustomizationLimit: 'aiCustomizations'
      }[feature] as keyof typeof featuresUsage;
      
      const currentUsage = { 
        daily: featuresUsage[usageKey], 
        monthly: featuresUsage[usageKey] 
      };
      
      return hasReachedLimit(
        subscriptionTier as SubscriptionTier,
        feature as any,
        currentUsage
      );
    },
    // Check if a usage amount is within the remaining limit
    isWithinUsageLimit: (feature: string, amount: number = 1): boolean => {
      try {
        const usageKey = {
          qrGenerationLimit: 'qrCodesGenerated',
          barcodeGenerationLimit: 'barcodesGenerated',
          bulkGenerationLimit: 'bulkGenerations',
          aiCustomizationLimit: 'aiCustomizations'
        }[feature] as keyof typeof featuresUsage;
        
        const currentUsage = { 
          daily: featuresUsage[usageKey] || 0, 
          monthly: featuresUsage[usageKey] || 0
        };
        
        const remaining = getRemainingUsage(
          subscriptionTier as SubscriptionTier,
          feature as any,
          currentUsage
        );
        
        return remaining.daily >= amount;
      } catch (error) {
        console.error("Error in isWithinUsageLimit:", error);
        return false;
      }
    }
  };
} 