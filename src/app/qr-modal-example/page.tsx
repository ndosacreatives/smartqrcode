'use client';

import React, { useState } from 'react';
import QRCodeModal from '@/components/QRCodeModal';

export default function QRModalExamplePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalQrValue, setModalQrValue] = useState('');

  const handleOpenModal = () => {
    // Example QR code value
    const qrValue = 'https://example.com/product/123';
    setModalQrValue(qrValue);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">QR Code Modal Example</h1>
      <p className="mb-4">This page demonstrates how to use the QRCodeModal component.</p>

      <button
        onClick={handleOpenModal}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Open QR Code Modal
      </button>

      <div className="mt-8 p-4 border rounded bg-gray-100">
        <h2 className="font-semibold mb-2">Usage Notes:</h2>
        <ul className="list-disc pl-5 text-sm">
          <li>The modal displays a QR code for the provided `qrValue`.</li>
          <li>It uses the `QRCodeModal` component.</li>
          <li>Click the button above to see it in action.</li>
          <li>The modal includes download options (PNG, SVG).</li>
          <li>The `qrValue` for this example is: <code>{`"https://example.com/product/123"`}</code></li>
        </ul>
      </div>

      {isModalOpen && (
        <QRCodeModal
          value={modalQrValue}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Product QR Code"
        />
      )}
    </div>
  );
} 