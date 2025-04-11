"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/context/SubscriptionContext";
import Link from "next/link";

const mockQrCodes = [
  { id: 1, name: "Website QR", scans: 124, lastScanned: "2023-12-18" },
  { id: 2, name: "Product Barcode", scans: 87, lastScanned: "2023-12-19" },
  { id: 3, name: "Contact Info", scans: 36, lastScanned: "2023-12-15" },
  { id: 4, name: "Wifi Access", scans: 14, lastScanned: "2023-12-17" },
];

export default function AnalyticsPage() {
  const router = useRouter();
  const { hasFeature, analytics, subscriptionTier } = useSubscription();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedCode, setSelectedCode] = useState<number | null>(null);
  
  // Create some mock data for the charts
  const generateChartData = () => {
    const data = [];
    const today = new Date();
    const daysToShow = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Generate random data point based on selected range
      const value = Math.floor(Math.random() * 15) + (dateRange === '7d' ? 5 : dateRange === '30d' ? 3 : 1);
      
      data.push({
        date: dateString,
        value
      });
    }
    
    return data;
  };
  
  const [chartData, setChartData] = useState(generateChartData());
  
  useEffect(() => {
    setChartData(generateChartData());
  }, [dateRange]);
  
  if (!hasFeature('analytics')) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Analytics & Tracking</h2>
            <p className="mt-2 text-gray-600">
              Unlock powerful QR code scan analytics to track engagement and performance.
            </p>
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <h3 className="font-semibold text-blue-800">Premium Feature</h3>
              <p className="mt-1 text-sm text-blue-600">
                Analytics & Tracking is available on Pro and Business plans.
              </p>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => router.push('/pricing')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Track and analyze your QR code and barcode performance.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Scans
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {analytics?.totalScans || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Last 30 Days
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {analytics?.lastMonthScans || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Most Popular
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 truncate">
                      {analytics?.topCode || "N/A"}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-pink-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Growth
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-green-600">
                      +{analytics?.monthlyGrowth || 0}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scan Activity Chart */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Scan Activity
            </h3>
            <div className="flex space-x-1">
              <button
                onClick={() => setDateRange('7d')}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  dateRange === '7d'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                7D
              </button>
              <button
                onClick={() => setDateRange('30d')}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  dateRange === '30d'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                30D
              </button>
              <button
                onClick={() => setDateRange('90d')}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  dateRange === '90d'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                90D
              </button>
            </div>
          </div>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="aspect-w-16 aspect-h-6">
            {/* Simplified chart representation using CSS */}
            <div className="h-64 flex items-end space-x-2">
              {chartData.map((dataPoint, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${dataPoint.value * 3}px` }}
                  ></div>
                  {(i === 0 || i === chartData.length - 1 || i % Math.floor(chartData.length / 5) === 0) && (
                    <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                      {new Date(dataPoint.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Geographic Data (Business plan only) */}
      {hasFeature('geographicData') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Geographic Distribution
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                {Object.entries(analytics?.scansByCountry || {}).map(([country, count], i) => (
                  <div key={i} className="flex items-center">
                    <div className="w-32 text-sm text-gray-600">{country}</div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${(count / (analytics?.totalScans || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-12 text-right text-sm text-gray-600 ml-4">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Device Breakdown
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                {Object.entries(analytics?.scansByDevice || {}).map(([device, count], i) => (
                  <div key={i} className="flex items-center">
                    <div className="w-24 text-sm text-gray-600">{device}</div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-600 h-2.5 rounded-full"
                          style={{ width: `${(count / (analytics?.totalScans || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-12 text-right text-sm text-gray-600 ml-4">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Performance */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            QR Code Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Scans
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Scanned
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {hasFeature('conversionAnalysis') ? 'Conversion Rate' : 'Status'}
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockQrCodes.map((code) => (
                <tr key={code.id} className={selectedCode === code.id ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{code.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{code.scans}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{code.lastScanned}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {hasFeature('conversionAnalysis') ? (
                      <div className="text-sm text-green-600">{(Math.random() * 5 + 2).toFixed(1)}%</div>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedCode(code.id === selectedCode ? null : code.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {code.id === selectedCode ? 'Hide Details' : 'View Details'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Analytics (Business Plan) */}
      {subscriptionTier === 'business' && (
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Export Analytics</h3>
              <p className="mt-1 text-sm text-gray-500">
                Download detailed analytics reports in various formats
              </p>
            </div>
            <div className="flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Export CSV
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Export PDF
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Schedule Reports
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Banner for Pro Users */}
      {subscriptionTier === 'pro' && (
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8 md:p-10 md:flex md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">
                Get Advanced Analytics with Business Plan
              </h3>
              <p className="mt-2 text-white text-opacity-90 text-sm md:text-base">
                Unlock geographic data, device tracking, conversion analysis, and more.
              </p>
            </div>
            <div className="mt-6 md:mt-0">
              <Link
                href="/pricing"
                className="inline-flex items-center px-6 py-3 border border-transparent shadow text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
              >
                Upgrade to Business
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 