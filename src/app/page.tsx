"use client";

import { useState } from "react";
import Link from "next/link";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import BarcodeGenerator from "@/components/BarcodeGenerator";
import SequenceGenerator from "@/components/SequenceGenerator";
import BulkSequenceGenerator from "@/components/BulkSequenceGenerator";

// Unified component for code generation
function UnifiedGenerator() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Check URL hash first (for sharing)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (['qrcode', 'barcode', 'sequence', 'bulk'].includes(hash)) {
        return hash;
      }
      
      // Then check localStorage (for returning users)
      const savedTab = localStorage.getItem('activeGeneratorTab');
      if (savedTab && ['qrcode', 'barcode', 'sequence', 'bulk'].includes(savedTab)) {
        return savedTab;
      }
    }
    
    // Default to qrcode if nothing found
    return "qrcode";
  });
  
  // Update localStorage and URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Save to localStorage for returning users
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeGeneratorTab', tab);
      
      // Update URL hash for shareability without page reload
      window.history.replaceState(null, '', `#${tab}`);
    }
  };
  
  return (
    <div className="w-full">
      {/* Inline Tab Navigation */}
      <div className="w-full bg-gray-50 rounded-lg p-2 border border-gray-100 mb-6">
        <nav className="-mb-px flex flex-wrap justify-center space-x-2 sm:space-x-6" aria-label="Tabs">
          {/* QR Code Tab */}
          <button
            onClick={() => handleTabChange('qrcode')}
            id="tab-qrcode"
            className={`${
              activeTab === 'qrcode'
                ? "bg-indigo-600 text-white font-bold shadow-md"
                : "bg-white text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
            } whitespace-nowrap py-3 px-4 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 flex-grow sm:flex-grow-0 text-center`}
          >
            QR Code Generator
          </button>
          {/* Barcode Tab */}
          <button
            onClick={() => handleTabChange('barcode')}
            id="tab-barcode"
            className={`${
              activeTab === 'barcode'
                ? "bg-indigo-600 text-white font-bold shadow-md"
                : "bg-white text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
            } whitespace-nowrap py-3 px-4 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 flex-grow sm:flex-grow-0 text-center`}
          >
            Barcode Generator
          </button>
          {/* Sequence Tab */}
          <button
            onClick={() => handleTabChange('sequence')}
            id="tab-sequence"
            className={`${
              activeTab === 'sequence'
                ? "bg-indigo-600 text-white font-bold shadow-md"
                : "bg-white text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
            } whitespace-nowrap py-3 px-4 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 flex-grow sm:flex-grow-0 text-center`}
          >
            Sequence Generator
          </button>
          {/* Bulk Sequence Tab */}
          <button
            onClick={() => handleTabChange('bulk')}
            id="tab-bulk"
            className={`${
              activeTab === 'bulk'
                ? "bg-indigo-600 text-white font-bold shadow-md"
                : "bg-white text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
            } whitespace-nowrap py-3 px-4 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 flex-grow sm:flex-grow-0 text-center`}
          >
            Bulk Sequence Generator
          </button>
        </nav>
      </div>
      
      {/* Generator Components */}
      <div className="bg-white rounded-lg shadow-md">
        {activeTab === "qrcode" && <QRCodeGenerator />}
        {activeTab === "barcode" && <BarcodeGenerator />}
        {activeTab === "sequence" && <SequenceGenerator />}
        {activeTab === "bulk" && <BulkSequenceGenerator />}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* All-in-one Generator Section */}
      <div className="mb-12 bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Generate Any Code Without Leaving the Page</h2>
        <UnifiedGenerator />
      </div>
      
      {/* Hero Section with Modern Look */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl shadow-2xl p-8 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="text-white">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              <span className="block">Smart QR Code &</span>
              <span className="block text-yellow-300">Barcode Generator</span>
            </h1>
            <p className="mt-4 text-xl text-blue-100">
              Generate QR codes and barcodes quickly and easily. Customize colors, size, and download in multiple formats.
            </p>
            <div className="mt-8 flex space-x-4">
              <Link href="#" className="px-6 py-3 bg-white text-primary hover:bg-blue-50 rounded-lg font-bold transition-colors shadow-md">
                Learn More
              </Link>
              <Link href="#" className="px-6 py-3 bg-yellow-400 text-gray-900 hover:bg-yellow-300 rounded-lg font-bold transition-colors shadow-md">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white rounded-3xl shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for code generation
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center group hover:bg-blue-50 p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-white mb-4 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM17.25 6.75h.75v.75h-.75v-.75ZM6.75 17.25h.75v.75h-.75v-.75Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 text-center">QR Code Generation</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Generate QR codes with custom colors, sizes, and error correction levels.
                </p>
              </div>

              <div className="flex flex-col items-center group hover:bg-blue-50 p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-white mb-4 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 text-center">Barcode Generation</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Create various barcode formats including CODE128, UPC, EAN, and more.
                </p>
              </div>

              <div className="flex flex-col items-center group hover:bg-blue-50 p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-white mb-4 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 text-center">Multiple Format Downloads</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Download your generated codes as PNG, SVG, JPEG or EPS with one click.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
