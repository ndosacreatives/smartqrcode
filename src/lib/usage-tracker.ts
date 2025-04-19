import { db } from '@/lib/firebase-admin';
import { FeatureType } from '@/lib/subscription';

export type UsageStats = {
  features: Record<string, {
    daily: {
      count: number;
      lastReset: Date;
    };
    monthly: {
      count: number;
      lastReset: Date;
    };
  }>;
};

/**
 * Get current usage stats for a user
 */
export async function getUserUsageStats(userId: string): Promise<UsageStats> {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    // Return empty usage stats if none exist
    if (!userData?.usageStats) {
      return {
        features: {}
      };
    }
    
    return userData.usageStats;
  } catch (error) {
    console.error('Error getting user usage stats:', error);
    throw error;
  }
}

/**
 * Increment usage count for a specific feature
 */
export async function incrementUsage(userId: string, feature: FeatureType): Promise<void> {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data() || {};
    const usageStats = userData.usageStats || { features: {} };
    
    // Initialize feature if it doesn't exist
    if (!usageStats.features[feature]) {
      usageStats.features[feature] = {
        daily: {
          count: 0,
          lastReset: new Date()
        },
        monthly: {
          count: 0,
          lastReset: new Date()
        }
      };
    }
    
    const now = new Date();
    const featureStats = usageStats.features[feature];
    
    // Reset daily count if it's a new day
    const lastDailyReset = featureStats.daily.lastReset instanceof Date 
      ? featureStats.daily.lastReset 
      : new Date(featureStats.daily.lastReset);
      
    if (now.getDate() !== lastDailyReset.getDate() || 
        now.getMonth() !== lastDailyReset.getMonth() || 
        now.getFullYear() !== lastDailyReset.getFullYear()) {
      featureStats.daily.count = 0;
      featureStats.daily.lastReset = now;
    }
    
    // Reset monthly count if it's a new month
    const lastMonthlyReset = featureStats.monthly.lastReset instanceof Date 
      ? featureStats.monthly.lastReset 
      : new Date(featureStats.monthly.lastReset);
      
    if (now.getMonth() !== lastMonthlyReset.getMonth() || 
        now.getFullYear() !== lastMonthlyReset.getFullYear()) {
      featureStats.monthly.count = 0;
      featureStats.monthly.lastReset = now;
    }
    
    // Increment counts
    featureStats.daily.count++;
    featureStats.monthly.count++;
    
    // Update user document
    await userRef.update({
      'usageStats.features': usageStats.features
    });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    throw error;
  }
}

/**
 * Reset usage stats for a user
 */
export async function resetUsageStats(
  userId: string, 
  feature?: FeatureType
): Promise<void> {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data() || {};
    const usageStats = userData.usageStats || { features: {} };
    const now = new Date();
    
    if (feature) {
      // Reset specific feature
      if (usageStats.features[feature]) {
        usageStats.features[feature] = {
          daily: {
            count: 0,
            lastReset: now
          },
          monthly: {
            count: 0,
            lastReset: now
          }
        };
      }
    } else {
      // Reset all features
      Object.keys(usageStats.features).forEach(feat => {
        usageStats.features[feat] = {
          daily: {
            count: 0,
            lastReset: now
          },
          monthly: {
            count: 0,
            lastReset: now
          }
        };
      });
    }
    
    // Update user document
    await userRef.update({
      'usageStats.features': usageStats.features
    });
  } catch (error) {
    console.error('Error resetting usage stats:', error);
    throw error;
  }
} 