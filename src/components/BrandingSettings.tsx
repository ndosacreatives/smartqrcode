"use client";

import React, { useState, useEffect } from "react";
// import { useSubscription } from "@/context/SubscriptionContext"; // Removed incorrect import
import { useSubscription } from "@/hooks/useSubscription"; // Import the actual hook
import { useRouter } from "next/navigation";
import { useAuth } from '@/context/FirebaseAuthContext';
import { db, storage } from "@/lib/firebase"; // Assuming firebase config is exported from here
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Define a type for brand colors if not already defined elsewhere
interface BrandColors {
  primary: string;
  secondary: string;
}

export default function BrandingSettings() {
  // Use the actual subscription hook for feature access check
  const { canAccess, loading: subscriptionLoading } = useSubscription();
  const { user } = useAuth(); // Get the current user
  const router = useRouter();

  // Local state for branding settings
  const [brandName, setBrandName] = useState<string>("");
  const [brandLogo, setBrandLogo] = useState<string>("");
  const [brandColors, setBrandColors] = useState<BrandColors>({ primary: "#1e40af", secondary: "#3b82f6" });
  const [customDomain, setCustomDomain] = useState<string>("");

  // State for loading, errors, and success messages
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // State for logo upload

  // Fetch branding settings from Firestore
  useEffect(() => {
    const fetchBrandingSettings = async () => {
      if (!user) {
        setLoading(false); // No user, stop loading
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Check for brandingSettings field, otherwise use defaults
          const settings = data.brandingSettings || {};
          setBrandName(settings.brandName || "");
          setBrandLogo(settings.brandLogo || "");
          setBrandColors(settings.brandColors || { primary: "#1e40af", secondary: "#3b82f6" });
          setCustomDomain(settings.customDomain || "");
        } else {
          // console.log("No branding settings found for user, using defaults.");
          // Keep default values initialized in useState
        }
      } catch (err) {
        console.error("Error fetching branding settings:", err);
        setError("Failed to load branding settings. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBrandingSettings();
  }, [user]); // Re-fetch if user changes

  // Function to handle file uploads to Firebase Storage
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return; // Need user to upload
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Optional: Add file size validation (e.g., < 2MB)
      // if (file.size > 2 * 1024 * 1024) {
      //   alert("File size should be less than 2MB");
      //   return;
      // }

      setIsUploading(true);
      setError(null); // Clear previous errors
      const storageRef = ref(storage, `users/${user.uid}/branding/logo/${file.name}`);

      try {
        // If there's an existing logo URL, try to delete the old file from storage
        if (brandLogo) {
          try {
            // Extract the path from the URL - this might need adjustment based on your URL structure
            const previousLogoPath = brandLogo.split('/o/')[1]?.split('?')[0];
            if (previousLogoPath) {
              const decodedPath = decodeURIComponent(previousLogoPath);
              const previousLogoRef = ref(storage, decodedPath);
               await deleteObject(previousLogoRef);
            }
          } catch (deleteError) {
             // Log deletion error but continue with upload
             console.warn("Could not delete previous logo:", deleteError);
          }
        }

        // Upload the new file
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        setBrandLogo(downloadURL); // Update state with the new logo URL
        // Optionally, immediately save the new URL to Firestore or wait for main save button
        // await handleSave(); // Uncomment if you want instant save on upload
      } catch (uploadError) {
        console.error("Error uploading logo:", uploadError);
        setError("Failed to upload logo. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }
  };

   // Function to remove the logo
  const removeLogo = async () => {
    if (!user || !brandLogo) return;

    setError(null);
    setIsUploading(true); // Use uploading state to disable buttons during removal

    try {
        // Extract path and delete from storage
        const logoPath = brandLogo.split('/o/')[1]?.split('?')[0];
        if (logoPath) {
            const decodedPath = decodeURIComponent(logoPath);
            const logoRef = ref(storage, decodedPath);
            await deleteObject(logoRef);
        }
        setBrandLogo(''); // Clear logo state
        // Optionally save this change immediately
        // await handleSave();
    } catch (deleteError) {
        console.error("Error removing logo:", deleteError);
        setError("Failed to remove logo. Please try again.");
    } finally {
        setIsUploading(false);
    }
};

  const handleSave = async () => {
    if (!user) {
      setError("You must be logged in to save settings.");
      return;
    }

    setLoading(true); // Indicate saving process
    setError(null);
    try {
      const userDocRef = doc(db, "users", user.uid);
      // Use setDoc with merge: true to update or create the brandingSettings field
      await setDoc(userDocRef, {
        brandingSettings: {
          brandName,
          brandLogo,
          brandColors,
          customDomain,
        }
      }, { merge: true }); // merge: true prevents overwriting other user data

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving branding settings:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Render logic ---

  // Handle loading state for subscription check
  if (subscriptionLoading) {
     return <div className="p-8 text-center">Checking subscription...</div>;
  }

  // Check feature access using canAccess from the actual hook
  if (!canAccess('customBranding')) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">White Label & Branding</h2>
        <div className="bg-amber-50 p-6 rounded-lg border border-amber-200 text-center">
          <h3 className="text-lg font-semibold text-amber-800 mb-3">Business Plan Feature</h3>
          <p className="text-amber-700 mb-4">
            White labeling and custom branding are available exclusively on our Business plan.
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            Upgrade to Business
          </button>
        </div>
      </div>
    );
  }

  // Handle loading state for fetching branding data
  if (loading && !subscriptionLoading) { // Don't show data loading if subscription is still loading
     return <div className="p-8 text-center">Loading branding settings...</div>;
  }

   // Handle error state
  if (error) {
     return <div className="p-8 text-center text-red-600 bg-red-50 rounded border border-red-200">{error}</div>;
  }


  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">White Label & Branding</h2>
        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
          Business Feature
        </span>
      </div>

      {showSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded transition-opacity duration-300 ease-in-out" role="alert">
          <p className="font-medium">Settings saved successfully!</p>
        </div>
      )}

      {/* Display general error messages here if not handled above */}
       {error && !loading && (
         <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
           <p className="font-medium">{error}</p>
         </div>
       )}


      <div className="space-y-8">
        {/* Company Branding */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Company Branding</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="brandNameInput" className="block text-sm font-medium text-gray-700 mb-2">
                Company/Brand Name
              </label>
              <input
                id="brandNameInput"
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:opacity-50"
                placeholder="Your Company Name"
                disabled={loading || isUploading} // Disable during loading/saving/uploading
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo
              </label>
              <div className="flex items-center space-x-4">
                {brandLogo ? (
                  <div className="relative h-16 w-16 border border-gray-200 rounded-md overflow-hidden">
                    <img
                      src={brandLogo}
                      alt="Company Logo"
                      className="h-full w-full object-contain"
                    />
                    <button
                      onClick={removeLogo} // Use removeLogo function
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md p-1 hover:bg-red-600 disabled:opacity-50"
                      aria-label="Remove logo"
                      disabled={loading || isUploading} // Disable during operations
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400">
                    {isUploading ? (
                       <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                    ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                     </svg>
                    )}
                  </div>
                )}
                <div>
                  <label className={`relative flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 ${loading || isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                    <span>{isUploading ? 'Uploading...' : (brandLogo ? 'Change Logo' : 'Upload Logo')}</span>
                    <input
                      id="logoUploadInput"
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml" // Be specific about types
                      onChange={handleLogoUpload}
                      className="sr-only"
                      disabled={loading || isUploading} // Disable during loading/saving/uploading
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, or SVG (max. 2MB recommended)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Colors */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Colors</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="primaryColorInput" className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex items-center">
                <input
                  id="primaryColorPicker"
                  type="color"
                  value={brandColors.primary}
                  onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
                  className="h-10 w-10 p-0 border-0 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || isUploading}
                />
                <input
                  id="primaryColorInput"
                  type="text"
                  value={brandColors.primary}
                  onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
                  className="ml-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:opacity-50"
                  placeholder="#1e40af"
                   pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$" // Basic hex validation
                  title="Enter a valid hex color code (e.g., #1e40af)"
                   disabled={loading || isUploading}
                />
              </div>
            </div>
            <div>
              <label htmlFor="secondaryColorInput" className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
              <div className="flex items-center">
                 <input
                  id="secondaryColorPicker"
                  type="color"
                  value={brandColors.secondary}
                  onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
                  className="h-10 w-10 p-0 border-0 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || isUploading}
                />
                <input
                   id="secondaryColorInput"
                  type="text"
                  value={brandColors.secondary}
                  onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
                  className="ml-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:opacity-50"
                  placeholder="#3b82f6"
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  title="Enter a valid hex color code (e.g., #3b82f6)"
                   disabled={loading || isUploading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Custom Domain */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Domain for QR Landing Pages</h3>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="customDomainInput" className="block text-sm font-medium text-gray-700 mb-2">
                Custom Domain
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  https://
                </span>
                <input
                  id="customDomainInput"
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="flex-1 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary disabled:opacity-50"
                  placeholder="yourbrand.qr.link"
                  disabled={loading || isUploading}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Your QR code landing pages will use this custom domain. For example: https://<strong>{customDomain || 'yourbrand.qr.link'}</strong>/product-name
              </p>
              {/* Removed DNS setup info for brevity, assuming it's handled elsewhere */}
            </div>
          </div>
        </div>

        {/* Analytics Section - Keep as is for now, might need separate state/logic */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">White Label Analytics</h3>
           {/* Add check for specific 'whiteLabelAnalytics' feature if needed */}
           {canAccess('whiteLabelAnalytics') ? (
               <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                 <div className="flex items-center">
                   <input
                     id="white-label-analytics"
                     name="white-label-analytics"
                     type="checkbox"
                     className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded disabled:opacity-50"
                     // Add state and handler if this needs to be saved
                     // checked={whiteLabelAnalyticsEnabled}
                     // onChange={(e) => setWhiteLabelAnalyticsEnabled(e.target.checked)}
                     disabled={loading || isUploading} // Example: disable if loading
                   />
                   <label htmlFor="white-label-analytics" className="ml-2 block text-sm text-gray-900">
                     Enable white-labeled analytics dashboards for clients
                   </label>
                 </div>
                 <p className="mt-2 text-sm text-gray-500">
                   Your clients will see your branding on their analytics dashboards without any reference to our service.
                 </p>
               </div>
            ) : (
                 <div className="bg-gray-100 p-4 rounded-md border border-gray-200">
                     <p className="text-sm text-gray-600">White label analytics requires a higher plan tier.</p>
                     {/* Optional: Add upgrade button */}
                 </div>
            )}
        </div>

        <div className="pt-5 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            {/* Reset button - functionality needs implementation if required */}
             <button
              type="button"
              // onClick={handleReset} // Add reset handler if needed
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              disabled={loading || isUploading}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="relative px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || isUploading} // Disable while loading/saving/uploading
            >
              {loading ? (
                <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                 </span>
              ) : (
                 'Save Settings'
              )}
               <span className={loading ? 'opacity-0' : 'opacity-100'}>Save Settings</span> {/* Hide text when loading */}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 