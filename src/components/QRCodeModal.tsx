"use client";

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  title?: string;
}

export default function QRCodeModal({ isOpen, onClose, value, title = 'QR Code' }: QRCodeModalProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [isBrowser, setIsBrowser] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Set isBrowser to true when component mounts (client-side only)
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Generate QR code when value changes
  useEffect(() => {
    if (!isBrowser || !value) return;
    
    const generateQRCode = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(value, {
          width: 256,
          margin: 2,
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };
    
    generateQRCode();
  }, [value, isBrowser]);

  useEffect(() => {
    if (!isBrowser) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, isBrowser]);

  const handleDownloadPNG = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `qrcode-${value.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.click();
  };

  if (!isBrowser || !isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 flex justify-center" ref={qrCodeRef}>
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt="QR Code" width={256} height={256} />
          ) : (
            <div className="h-64 w-64 flex items-center justify-center bg-gray-100">
              <span className="text-gray-500">Loading QR code...</span>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t">
          <div className="mb-2 text-sm text-gray-600 truncate">
            <span className="font-medium">URL:</span> {value}
          </div>
          <button
            onClick={handleDownloadPNG}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
            disabled={!qrCodeDataUrl}
          >
            Download QR Code
          </button>
        </div>
      </div>
    </div>
  );
} 