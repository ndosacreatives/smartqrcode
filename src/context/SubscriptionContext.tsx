"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define subscription types
export type SubscriptionTier = "free" | "pro" | "business";

// Define features
export type FeatureKey =
  | "advancedCustomization"
  | "svgDownload"
  | "pdfDownload"
  | "noWatermark"
  | "analytics"
  | "apiAccess"
  | "whiteLabel"
  | "bulkGeneration"
  | "barcodeCustomization"
  | "premiumTemplates"
  | "customBranding"
  | "brandedLandingPages"
  | "customDomain"
  | "scanStatistics"
  | "geographicData"
  | "deviceTracking"
  | "conversionAnalysis";

// Define analytics data structure
export interface AnalyticsData {
  totalScans: number;
  dailyScans: number[];
  scansByCountry: Record<string, number>;
  scansByDevice: Record<string, number>;
  conversionRate: number;
  lastUpdated: string;
}

// Define context type
interface SubscriptionContextType {
  subscriptionTier: SubscriptionTier;
  isLoading: boolean;
  hasFeature: (feature: FeatureKey) => boolean;
  upgradeSubscription: (tier: SubscriptionTier) => void;
  remainingDaily: number;
  decrementDaily: () => void;
  // New fields for enhanced features
  bulkGenerationLimit: number;
  analytics: AnalyticsData | null;
  showWatermark: boolean;
  brandName: string;
  setBrandName: (name: string) => void;
  brandLogo: string;
  setBrandLogo: (url: string) => void;
  brandColors: { primary: string; secondary: string };
  setBrandColors: (colors: { primary: string; secondary: string }) => void;
  customDomain: string;
  setCustomDomain: (domain: string) => void;
}

// Create context
const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Create Provider component
interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("free");
  const [isLoading, setIsLoading] = useState(true);
  const [remainingDaily, setRemainingDaily] = useState(5); // Free tier limit
  
  // New state for enhanced features
  const [brandName, setBrandName] = useState<string>("");
  const [brandLogo, setBrandLogo] = useState<string>("");
  const [brandColors, setBrandColors] = useState<{ primary: string; secondary: string }>({
    primary: "#1e40af",
    secondary: "#3b82f6"
  });
  const [customDomain, setCustomDomain] = useState<string>("");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Feature map - which tiers have access to which features
  const featureMap: Record<FeatureKey, SubscriptionTier[]> = {
    advancedCustomization: ["pro", "business"],
    svgDownload: ["pro", "business"],
    pdfDownload: ["pro", "business"],
    noWatermark: ["pro", "business"],
    analytics: ["pro", "business"],
    apiAccess: ["business"],
    whiteLabel: ["business"],
    bulkGeneration: ["pro", "business"],
    barcodeCustomization: ["pro", "business"],
    // New features
    premiumTemplates: ["pro", "business"],
    customBranding: ["business"],
    brandedLandingPages: ["business"],
    customDomain: ["business"],
    scanStatistics: ["pro", "business"],
    geographicData: ["business"],
    deviceTracking: ["business"],
    conversionAnalysis: ["business"],
  };

  // Get bulk generation limit based on subscription tier
  const getBulkGenerationLimit = (): number => {
    switch (subscriptionTier) {
      case "free":
        return 10;
      case "pro":
        return 100;
      case "business":
        return 1000;
      default:
        return 10;
    }
  };

  // Determine if watermark should be shown
  const getShowWatermark = (): boolean => {
    return subscriptionTier === "free";
  };

  useEffect(() => {
    // Load subscription data from localStorage
    const loadSubscriptionData = () => {
      try {
        const storedTier = localStorage.getItem("subscriptionTier") as SubscriptionTier;
        if (storedTier) {
          setSubscriptionTier(storedTier);
        }

        // Load daily remaining count
        const today = new Date().toISOString().split("T")[0];
        const storedDate = localStorage.getItem("lastCheckDate");
        const storedCount = localStorage.getItem("remainingDaily");

        if (storedDate === today && storedCount) {
          setRemainingDaily(Number(storedCount));
        } else {
          // Reset count for a new day
          localStorage.setItem("lastCheckDate", today);
          localStorage.setItem("remainingDaily", "5");
          setRemainingDaily(5);
        }

        // Load branding information if available
        const storedBrandName = localStorage.getItem("brandName");
        if (storedBrandName) setBrandName(storedBrandName);
        
        const storedBrandLogo = localStorage.getItem("brandLogo");
        if (storedBrandLogo) setBrandLogo(storedBrandLogo);
        
        const storedBrandColors = localStorage.getItem("brandColors");
        if (storedBrandColors) setBrandColors(JSON.parse(storedBrandColors));
        
        const storedCustomDomain = localStorage.getItem("customDomain");
        if (storedCustomDomain) setCustomDomain(storedCustomDomain);

        // Load mock analytics data for demo
        if (storedTier && (storedTier === "pro" || storedTier === "business")) {
          setAnalytics({
            totalScans: 247,
            dailyScans: [12, 15, 8, 20, 18, 25, 14],
            scansByCountry: {
              "United States": 120,
              "United Kingdom": 45,
              "Canada": 32,
              "Germany": 28,
              "France": 22
            },
            scansByDevice: {
              "Mobile": 158,
              "Desktop": 69,
              "Tablet": 20
            },
            conversionRate: 3.2,
            lastUpdated: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error("Error loading subscription data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptionData();
  }, []);

  // Save remaining daily count whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("remainingDaily", remainingDaily.toString());
    }
  }, [remainingDaily, isLoading]);

  // Save branding settings
  useEffect(() => {
    if (!isLoading && subscriptionTier === "business") {
      localStorage.setItem("brandName", brandName);
      localStorage.setItem("brandLogo", brandLogo);
      localStorage.setItem("brandColors", JSON.stringify(brandColors));
      localStorage.setItem("customDomain", customDomain);
    }
  }, [brandName, brandLogo, brandColors, customDomain, isLoading, subscriptionTier]);

  const hasFeature = (feature: FeatureKey): boolean => {
    // Free tier always has access to basic features
    if (subscriptionTier === "free") {
      // Check if they have daily quota remaining for QR code generation
      if (feature === "bulkGeneration" || feature === "pdfDownload" || feature === "svgDownload" || 
          feature === "noWatermark" || feature === "premiumTemplates" || feature === "scanStatistics") {
        return false;
      }
    }
    
    return featureMap[feature]?.includes(subscriptionTier) || false;
  };

  const upgradeSubscription = (tier: SubscriptionTier) => {
    setSubscriptionTier(tier);
    localStorage.setItem("subscriptionTier", tier);
  };

  const decrementDaily = () => {
    if (subscriptionTier === "free" && remainingDaily > 0) {
      setRemainingDaily((prev) => prev - 1);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionTier,
        isLoading,
        hasFeature,
        upgradeSubscription,
        remainingDaily,
        decrementDaily,
        // New fields
        bulkGenerationLimit: getBulkGenerationLimit(),
        analytics,
        showWatermark: getShowWatermark(),
        brandName,
        setBrandName,
        brandLogo, 
        setBrandLogo,
        brandColors,
        setBrandColors,
        customDomain,
        setCustomDomain
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

// Hook for using the subscription context
export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}; 