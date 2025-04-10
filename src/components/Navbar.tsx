"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <nav className="bg-primary shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z" />
              </svg>
              <span className="text-white text-xl font-bold">Smart QR & Barcode</span>
            </Link>
          </div>
          
          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center justify-center flex-1 mx-8">
            <div className="flex space-x-4">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/")
                    ? "bg-blue-700 text-white"
                    : "text-white hover:bg-blue-600"
                }`}
              >
                Home
              </Link>
              
              <Link
                href="/qrcode"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/qrcode")
                    ? "bg-blue-700 text-white"
                    : "text-white hover:bg-blue-600"
                }`}
              >
                QR Code
              </Link>
              
              <Link
                href="/barcode"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/barcode")
                    ? "bg-blue-700 text-white"
                    : "text-white hover:bg-blue-600"
                }`}
              >
                Barcode
              </Link>

              <Link
                href="/about"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/about")
                    ? "bg-blue-700 text-white"
                    : "text-white hover:bg-blue-600"
                }`}
              >
                About
              </Link>
            </div>
          </div>
          
          {/* Login/Register Buttons */}
          <div className="hidden md:flex items-center">
            <Link
              href="/login"
              className="ml-4 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:bg-blue-600 focus:outline-none"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="ml-4 px-3 py-2 border border-white text-sm font-medium rounded-md text-white hover:bg-blue-600 focus:outline-none"
            >
              Register
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-600 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/")
                  ? "bg-blue-700 text-white"
                  : "text-white hover:bg-blue-600"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            
            <Link
              href="/qrcode"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/qrcode")
                  ? "bg-blue-700 text-white"
                  : "text-white hover:bg-blue-600"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              QR Code
            </Link>
            
            <Link
              href="/barcode"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/barcode")
                  ? "bg-blue-700 text-white"
                  : "text-white hover:bg-blue-600"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Barcode
            </Link>

            <Link
              href="/about"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive("/about")
                  ? "bg-blue-700 text-white"
                  : "text-white hover:bg-blue-600"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            
            <div className="pt-4 pb-3 border-t border-blue-700">
              <div className="flex items-center px-5">
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="ml-4 block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 