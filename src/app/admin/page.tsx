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

      {/* User Management Section */}
      <div className="user-management py-8">
        <h2 className="text-xl font-bold mb-4">User Management</h2>
        <div className="bg-white p-4 rounded shadow">
          <input type="text" placeholder="Search users..." className="w-full p-2 mb-4 border rounded" />
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Map through users and display rows */}
              <tr>
                <td className="py-2">John Doe</td>
                <td className="py-2">john@example.com</td>
                <td className="py-2">Admin</td>
                <td className="py-2">
                  <button className="text-blue-500">Edit</button>
                  <button className="text-red-500 ml-2">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Overview Section */}
      <div className="analytics-overview py-8">
        <h2 className="text-xl font-bold mb-4">Analytics Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-gray-500 text-sm font-medium">Active Users</h3>
            <p className="text-3xl font-semibold">--</p> {/* Replace with actual data */}
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-gray-500 text-sm font-medium">New Signups</h3>
            <p className="text-3xl font-semibold">--</p> {/* Replace with actual data */}
          </div>
        </div>
      </div>

      {/* Content Management Section */}
      <div className="content-management py-8">
        <h2 className="text-xl font-bold mb-4">Content Management</h2>
        <div className="bg-white p-4 rounded shadow">
          <p>Manage your content here.</p>
          {/* Add content management tools */}
        </div>
      </div>

      {/* Settings Section */}
      <div className="settings py-8">
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <div className="bg-white p-4 rounded shadow">
          <p>Configure application settings.</p>
          {/* Add settings controls */}
        </div>
      </div>

      {/* Notifications Section */}
      <div className="notifications py-8">
        <h2 className="text-xl font-bold mb-4">Notifications</h2>
        <div className="bg-white p-4 rounded shadow">
          <p>View and manage notifications.</p>
          {/* Add notification management tools */}
        </div>
      </div>

      {/* Support Requests Section */}
      <div className="support-requests py-8">
        <h2 className="text-xl font-bold mb-4">Support Requests</h2>
        <div className="bg-white p-4 rounded shadow">
          <p>Respond to user support requests.</p>
          {/* Add support request management tools */}
        </div>
      </div>
    </div>
  );
} 