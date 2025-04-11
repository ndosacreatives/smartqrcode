"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/context/SubscriptionContext";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/context/FirebaseAuthContext";

const mockSavedCodes = [
  { id: 1, name: "Website QR", type: "qrcode", content: "https://example.com", createdAt: "2023-12-01" },
  { id: 2, name: "Product Barcode", type: "barcode", content: "1234567890128", createdAt: "2023-12-05" },
  { id: 3, name: "Contact Info", type: "qrcode", content: "vcard", createdAt: "2023-12-10" },
  { id: 4, name: "Wifi Access", type: "qrcode", content: "wifi", createdAt: "2023-12-15" },
];

const mockAnalytics = {
  totalScans: 247,
  lastMonthScans: 78,
  topCode: "Website QR",
  topCodeScans: 124,
  monthlyGrowth: 12.5,
};

export default function DashboardPage() {
  const router = useRouter();
  const { subscriptionTier, hasFeature, remainingDaily } = useSubscription();
  const [savedCodes, setSavedCodes] = useState(mockSavedCodes);
  const [analytics, setAnalytics] = useState(mockAnalytics);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-12 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  const username = user.displayName;
  const userEmail = user.email;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome, {username || "User"}!</h1>
        <p className="text-gray-600 mb-6">
          Manage your QR codes, barcodes, and account settings from this dashboard.
        </p>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Your saved QR codes and barcodes will appear here once you start creating them.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div className="bg-indigo-600 p-4">
            <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Create QR Code</h3>
            <p className="text-gray-600 mb-4">Create custom QR codes with your content and styling preferences.</p>
            <Link href="/#qrcode" className="text-indigo-600 font-medium hover:text-indigo-700">
              Create Now →
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div className="bg-blue-600 p-4">
            <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Generate Barcode</h3>
            <p className="text-gray-600 mb-4">Create various types of barcodes for your business needs.</p>
            <Link href="/#barcode" className="text-blue-600 font-medium hover:text-blue-700">
              Generate Now →
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div className="bg-green-600 p-4">
            <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Bulk Generator</h3>
            <p className="text-gray-600 mb-4">Generate multiple QR codes or barcodes in a single batch.</p>
            <Link href="/#bulk" className="text-green-600 font-medium hover:text-green-700">
              Start Batch →
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Account Information</h2>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between pb-3 border-b border-gray-200">
            <span className="font-medium text-gray-600">Email</span>
            <span className="text-gray-800">{userEmail || "Not available"}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between pb-3 border-b border-gray-200">
            <span className="font-medium text-gray-600">Subscription</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subscriptionTier === 'pro' ? 'bg-green-100 text-green-800' : subscriptionTier === 'business' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
              {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between">
            <span className="font-medium text-gray-600">Member Since</span>
            <span className="text-gray-800">{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "Not available"}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 