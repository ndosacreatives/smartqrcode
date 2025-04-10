"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { id: "qrcode", label: "QR Code Generator", href: "/qrcode" },
  { id: "barcode", label: "Barcode Generator", href: "/barcode" },
  { id: "sequence", label: "Sequence Generator", href: "/sequence" },
  { id: "bulk", label: "Bulk Sequence Generator", href: "/bulk" },
];

export default function TabNavigation() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <div className="w-full border-b border-gray-300 mb-6 bg-white shadow-sm rounded-t-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="-mb-px flex flex-wrap space-x-1 sm:space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`${
                isActive(tab.href)
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-gray-700 hover:text-primary hover:border-gray-400"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm sm:text-base transition-colors flex-grow sm:flex-grow-0 text-center`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
} 