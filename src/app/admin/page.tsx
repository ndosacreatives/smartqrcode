"use client";

import React from 'react';

export default function AdminDashboardPage() {
  // Fetch and display summary statistics here (e.g., user count, total codes)
  // You would typically use useEffect to fetch data on component mount

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Example Stat Card */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-gray-500 text-sm font-medium">Total Users</h2>
          <p className="text-3xl font-semibold">--</p> {/* Replace with actual data */}
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-gray-500 text-sm font-medium">QR Codes Generated</h2>
          <p className="text-3xl font-semibold">--</p> {/* Replace with actual data */}
        </div>
        {/* Add more stat cards */}
      </div>
      {/* Add more dashboard components like recent activity, charts, etc. */}
    </div>
  );
} 