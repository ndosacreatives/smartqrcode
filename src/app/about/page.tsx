import React from "react";
import Link from "next/link";

export const metadata = {
  title: "About - Smart QR & Barcode",
  description: "Learn about our QR code and barcode generator app",
};

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl mb-8">
          About Smart QR Code & Barcode Generator
        </h1>
        
        <div className="prose prose-lg prose-blue mx-auto">
          <p>
            Smart QR Code & Barcode Generator is a free, easy-to-use web application that allows you to create QR codes and barcodes for various purposes.
          </p>
          
          <h2>Our Features</h2>
          <ul>
            <li>Generate QR codes for URLs, text, contact information, and more</li>
            <li>Create barcodes in various formats including CODE128, UPC, EAN, and others</li>
            <li>Customize colors, size, and other parameters</li>
            <li>Download your generated codes as high-quality PNG images</li>
            <li>No registration required - completely free to use</li>
          </ul>
          
          <h2>Why Use QR Codes and Barcodes?</h2>
          <p>
            QR codes and barcodes provide a quick and efficient way to share information. They can be used in:
          </p>
          <ul>
            <li>Business cards and marketing materials</li>
            <li>Product packaging and inventory management</li>
            <li>Event tickets and check-ins</li>
            <li>Restaurant menus and ordering systems</li>
            <li>Contact information sharing</li>
            <li>Website and app links</li>
          </ul>
          
          <h2>Privacy</h2>
          <p>
            We value your privacy. Our QR code and barcode generator operates entirely in your browser. 
            We do not store any of the data you enter or the codes you generate on our servers.
          </p>
          
          <div className="mt-8">
            <Link 
              href="/"
              className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline inline-block"
            >
              Generate Your First Code
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 