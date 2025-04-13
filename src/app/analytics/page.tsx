"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useSubscription } from "@/context/SubscriptionContext";
import { AnalyticsData, getAnalyticsData } from "@/lib/analyticsService";
import { useAuth } from "@/context/FirebaseAuthContext";
import DateRangePicker from "@/components/admin/DateRangePicker"; // Assuming you have this

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
  }[];
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { hasFeatureAccess, isLoading: subscriptionLoading } = useSubscription();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [chartData, setChartData] = useState<Record<string, ChartData>>({});

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    
    if (!hasFeatureAccess('analytics')) {
      setError("Analytics feature is not available for your current subscription tier.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getAnalyticsData(user.uid, dateRange.startDate, dateRange.endDate);
      setAnalyticsData(data);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, [user, dateRange, hasFeatureAccess]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Memoized chart data generation
  const generateChartData = useCallback(() => {
    if (!analyticsData) {
      setChartData({});
      return;
    }

    const scansByDayData = {
      labels: Object.keys(analyticsData.scansByDay || {}),
      datasets: [
        {
          label: "Scans per Day",
          data: Object.values(analyticsData.scansByDay || {}),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
      ],
    };
    
    const scansByCountryData = {
        labels: Object.keys(analyticsData.scansByCountry || {}),
        datasets: [
            {
                label: "Scans by Country",
                data: Object.values(analyticsData.scansByCountry || {}).map(val => typeof val === 'number' ? val : 0), // Ensure data is number
                backgroundColor: "rgba(153, 102, 255, 0.6)",
            },
        ],
    };
    
    const deviceBreakdownData = {
        labels: Object.keys(analyticsData.deviceBreakdown || {}),
        datasets: [
            {
                label: "Scans by Device Type",
                data: Object.values(analyticsData.deviceBreakdown || {}).map(val => typeof val === 'number' ? val : 0), // Ensure data is number
                backgroundColor: "rgba(255, 159, 64, 0.6)",
            },
        ],
    };
    
    setChartData({ scansByDayData, scansByCountryData, deviceBreakdownData });

  }, [analyticsData]);

  useEffect(() => {
    if (analyticsData) {
      generateChartData();
    }
  }, [analyticsData, generateChartData]); // Added generateChartData

  if (subscriptionLoading || loading) {
    return <div className="text-center py-10">Loading analytics...</div>;
  }
  
  if (error) {
    return <div className="text-center py-10 text-red-600">Error: {error}</div>;
  }

  if (!hasFeatureAccess('analytics')) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold mb-4">Analytics Unavailable</h2>
        <p>Upgrade to the Pro or Business tier to access detailed analytics.</p>
        {/* Add link to pricing page */}
      </div>
    );
  }

  if (!analyticsData) {
    return <div className="text-center py-10">No analytics data available for the selected period.</div>;
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Chart Title',
      },
    },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
      
      {/* Date Range Picker */}
      <div className="mb-6">
        <DateRangePicker 
          initialRange={dateRange} 
          onRangeChange={setDateRange} 
        />
        <button onClick={fetchAnalytics} className="ml-4 px-4 py-2 bg-blue-500 text-white rounded">
          Apply Filter
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard title="Total Scans" value={analyticsData.totalScans} />
        <SummaryCard title="Unique Devices" value={analyticsData.uniqueDevices} />
        <SummaryCard title="Most Active Country" value={analyticsData.mostActiveCountry} />
        <SummaryCard title="Top Referrer" value={analyticsData.topReferrer} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scans per Day Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Scans per Day</h2>
          {chartData.scansByDayData?.labels?.length > 0 ? (
            <Bar options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { display: true, text: 'Scans per Day' } } }} data={chartData.scansByDayData} />
          ) : (
            <p>No scan data for this period.</p>
          )}
        </div>

        {/* Scans by Country Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Scans by Country</h2>
           {chartData.scansByCountryData?.labels?.length > 0 ? (
            <Bar options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { display: true, text: 'Scans by Country' } } }} data={chartData.scansByCountryData} />
           ) : (
            <p>No country data available.</p>
          )}
        </div>

        {/* Device Breakdown Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Device Breakdown</h2>
          {chartData.deviceBreakdownData?.labels?.length > 0 ? (
            <Bar options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { display: true, text: 'Device Breakdown' } } }} data={chartData.deviceBreakdownData} />
          ) : (
            <p>No device data available.</p>
          )}
        </div>

        {/* Top Referrers List (Example) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Top Referrers</h2>
          <ul className="space-y-2">
            {Object.entries(analyticsData.scansByReferrer || {}).slice(0, 5).map(([referrer, count]) => (
              <li key={referrer} className="flex justify-between">
                <span>{referrer || 'Direct'}</span>
                <span className="font-medium">{typeof count === 'number' ? count : 'N/A'} scans</span>
              </li>
            ))}
             {Object.keys(analyticsData.scansByReferrer || {}).length === 0 && <li>No referrer data.</li>}
          </ul>
        </div>
        
        {/* Top Scan Locations (Example) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Top Scan Locations</h2>
          <ul className="space-y-2">
             {Object.entries(analyticsData.scansByLocation || {}).slice(0, 5).map(([location, count]) => (
              <li key={location} className="flex justify-between">
                <span>{location}</span>
                <span className="font-medium">{typeof count === 'number' ? count : 'N/A'} scans</span>
              </li>
            ))}
            {Object.keys(analyticsData.scansByLocation || {}).length === 0 && <li>No location data.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string | number;
}

function SummaryCard({ title, value }: SummaryCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-semibold text-gray-900">{value || 'N/A'}</p>
    </div>
  );
} 