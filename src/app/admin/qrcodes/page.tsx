'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/FirebaseAuthContext';

interface QrCode {
  id: string;
  userId: string;
  userEmail?: string;
  name: string;
  content: string;
  type: 'qrcode' | 'barcode';
  format?: string;
  createdAt: any;
  updatedAt: any;
  scans: number;
  lastScan?: any;
  customizations?: {
    foregroundColor?: string;
    backgroundColor?: string;
    logo?: string;
    [key: string]: any;
  };
}

export default function AdminQrCodesPage() {
  const { user } = useAuth();
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Function to refresh QR code data
  const refreshQrCodes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/qrcodes', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      setQrCodes(data.qrCodes || []);
    } catch (err) {
      console.error('Failed to fetch QR codes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshQrCodes();
  }, []);

  // Filter QR codes based on search term and filters
  const filteredQrCodes = qrCodes.filter(qrCode => {
    const matchesSearch = 
      searchTerm === '' || 
      qrCode.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qrCode.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (qrCode.userEmail && qrCode.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === 'all' || qrCode.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Sort QR codes
  const sortedQrCodes = [...filteredQrCodes].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'most_scanned':
        return b.scans - a.scans;
      default:
        return 0;
    }
  });

  const handleDeleteQrCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this QR code? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/qrcodes/${id}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }
      
      // Refresh QR codes to show current data
      await refreshQrCodes();
      
      // Show success message
      setError(null);
      // Create temporary success message
      const successMessage = "QR code deleted successfully";
      alert(successMessage);
    } catch (err) {
      console.error('Failed to delete QR code:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete QR code');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      // Handle Firestore timestamps or ISO strings
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  return (
    <div className="px-1 py-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">QR Code Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage all QR codes in the system
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search QR Codes
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by name, content, or user email..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Type
            </label>
            <select
              id="typeFilter"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="qrcode">QR Codes</option>
              <option value="barcode">Barcodes</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sortBy"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="most_scanned">Most Scanned</option>
            </select>
          </div>
        </div>
        
        {/* Actions */}
        <div className="mt-4 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">
              {filteredQrCodes.length} {filteredQrCodes.length === 1 ? 'QR code' : 'QR codes'} found
            </span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QR Codes Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading QR codes...</p>
          </div>
        ) : sortedQrCodes.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No QR codes found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QR Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scans
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedQrCodes.map((qrCode) => (
                  <tr key={qrCode.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* Placeholder for QR code preview */}
                      <div className="h-12 w-12 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                        {qrCode.type === 'qrcode' ? 'QR' : 'BAR'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{qrCode.userEmail || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{qrCode.userId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{qrCode.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs" title={qrCode.content}>
                        {qrCode.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        qrCode.type === 'qrcode' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {qrCode.type === 'qrcode' ? 'QR Code' : 'Barcode'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {qrCode.scans.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(qrCode.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleDeleteQrCode(qrCode.id)}
                        className="text-red-600 hover:text-red-900 ml-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 