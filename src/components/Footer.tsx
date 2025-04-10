import React from "react";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
        <div className="mt-4 flex justify-center space-x-6">
          <Link href="/" className="text-gray-400 hover:text-white">
            Home
          </Link>
          <Link href="/qrcode" className="text-gray-400 hover:text-white">
            QR Code
          </Link>
          <Link href="/barcode" className="text-gray-400 hover:text-white">
            Barcode
          </Link>
          <Link href="/about" className="text-gray-400 hover:text-white">
            About
          </Link>
        </div>
        <p className="mt-4 text-center text-gray-400">
          &copy; {currentYear} Smart QR Code & Barcode Generator. All rights reserved.
        </p>
      </div>
    </footer>
  );
} 