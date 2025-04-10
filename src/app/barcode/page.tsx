import React from "react";
import BarcodeGenerator from "@/components/BarcodeGenerator";
import TabNavigation from "@/components/TabNavigation";

export const metadata = {
  title: "Barcode Generator - Smart QR & Barcode",
  description: "Generate custom barcodes in various formats and download as PNG",
};

export default function BarcodePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Barcode Generator
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-base text-gray-500 sm:text-lg">
          Create barcodes in various formats including CODE128, UPC, EAN, and more. Customize appearance and download as high-quality images.
        </p>
      </div>
      
      <TabNavigation />
      <BarcodeGenerator />
    </div>
  );
} 