export type SubscriptionTier = 'free' | 'pro' | 'business';

export interface UserData {
  id: string;
  email: string;
  displayName: string | null;
  photoURL?: string;
  createdAt?: any; // Using any for now to handle Firebase Timestamp
  updatedAt?: any; // Using any for now to handle Firebase Timestamp
  subscriptionTier: SubscriptionTier;
  role?: 'admin' | 'user';
  featuresUsage: {
    qrCodesGenerated: number;
    barcodesGenerated: number;
    bulkGenerations: number;
    aiCustomizations: number;
  };
}

export interface SubscriptionFeatures {
  qrGenerationLimit: number;
  barcodeGenerationLimit: number;
  bulkGenerationLimit: number;
  aiCustomizationLimit: number;
}

// Defines the shape of subscription hook return value
export interface UseSubscriptionReturn {
  loading: boolean;
  error: string | null;
  subscriptionTier: SubscriptionTier;
  featuresUsage: UserData['featuresUsage'];
  limits: any;
  getLimit: (featureKey: string) => number;
  canUseFeature: (feature: string) => boolean;
  remainingUsage: (feature: string) => number;
  hasReachedLimit: (feature: string) => boolean;
  isWithinUsageLimit: (feature: string, amount?: number) => boolean;
} 