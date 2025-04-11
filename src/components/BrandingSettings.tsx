"use client";

import React, { useState } from "react";
import { useSubscription } from "@/context/SubscriptionContext";
import { useRouter } from "next/navigation";

export default function BrandingSettings() {
  const {
    hasFeature,
    brandName,
    setBrandName,
    brandLogo,
    setBrandLogo,
    brandColors,
    setBrandColors,
    customDomain,
    setCustomDomain,
    subscriptionTier
  } = useSubscription();

  const router = useRouter();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Function to handle file uploads
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setLogoFile(files[0]);
      // In a real app, you would upload this to a server or cloud storage
      // For demo, we'll use a data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setBrandLogo(event.target.result.toString());
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleSave = () => {
    // In a real app, you would save these settings to your backend
    // For demo, we're using localStorage in the subscription context
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (!hasFeature('customBranding')) {
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

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">White Label & Branding</h2>
        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
          Business Feature
        </span>
      </div>

      {showSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          <p className="font-medium">Settings saved successfully!</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Company Branding */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Company Branding</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company/Brand Name
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Your Company Name"
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
                      onClick={() => setBrandLogo('')}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md p-1"
                      aria-label="Remove logo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div>
                  <label className="relative flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <span>{brandLogo ? 'Change Logo' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="sr-only"
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, or SVG (max. 2MB)
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  value={brandColors.primary}
                  onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
                  className="h-10 w-10 border-0 rounded-md cursor-pointer"
                />
                <input
                  type="text"
                  value={brandColors.primary}
                  onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
                  className="ml-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="#1e40af"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  value={brandColors.secondary}
                  onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
                  className="h-10 w-10 border-0 rounded-md cursor-pointer"
                />
                <input
                  type="text"
                  value={brandColors.secondary}
                  onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
                  className="ml-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="#3b82f6"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Domain
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  https://
                </span>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="flex-1 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="yourbrand.qr.link"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Your QR code landing pages will use this custom domain. For example: https://<strong>{customDomain || 'yourbrand.qr.link'}</strong>/product
              </p>
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 md:flex md:justify-between">
                    <p className="text-sm text-blue-700">
                      To use a custom domain, you'll need to configure your DNS settings. Our team can assist you with this process.
                    </p>
                    <p className="mt-3 text-sm md:mt-0 md:ml-6">
                      <a href="#" className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600">
                        Contact Support <span aria-hidden="true">&rarr;</span>
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">White Label Analytics</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <div className="flex items-center">
              <input
                id="white-label-analytics"
                name="white-label-analytics"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="white-label-analytics" className="ml-2 block text-sm text-gray-900">
                Enable white-labeled analytics dashboards for clients
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Your clients will see your branding on their analytics dashboards without any reference to our service.
            </p>
          </div>
        </div>

        <div className="pt-5 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Reset to Defaults
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 