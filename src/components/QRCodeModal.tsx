"use client";

import React, { useState, useRef, useEffect } from "react";
import QRCode from "react-qr-code";
import * as qrcode from "qrcode";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  title?: string;
  downloadable?: boolean;
}

export default function QRCodeModal({ 
  isOpen, 
  onClose, 
  value, 
  title = "QR Code", 
  downloadable = true 
}: QRCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrSize, setQrSize] = useState(256);

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const downloadQRCode = async () => {
    if (!value || !qrRef.current) return;
    
    try {
      const canvas = await qrcode.toCanvas(value, {
        width: 512,
        margin: 2,
      });
      
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `qrcode-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error downloading QR code", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close modal"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>
        
        {/* QR Code */}
        <div 
          className="flex justify-center items-center my-6 bg-gray-50 p-6 rounded-lg"
          ref={qrRef}
        >
          {value ? (
            <QRCode 
              value={value} 
              size={qrSize} 
              level="M"
              className="rounded-md"
            />
          ) : (
            <div className="text-gray-400">No QR code value provided</div>
          )}
        </div>
        
        {/* Footer with QR value and download button */}
        <div className="mt-4">
          <div className="text-sm text-gray-600 break-all mb-4">
            {value}
          </div>
          
          {downloadable && (
            <button
              onClick={downloadQRCode}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
            >
              Download QR Code
            </button>
          )}
        </div>
        
        {/* Backdrop click to close */}
        <div 
          className="fixed inset-0 z-[-1]" 
          onClick={onClose}
          aria-hidden="true"
        />
      </div>
    </div>
  );
} 