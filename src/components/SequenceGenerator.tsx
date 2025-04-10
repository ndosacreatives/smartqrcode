"use client";

import React, { useState, useRef, useEffect } from "react";
import QRCode from "react-qr-code";
import * as qrcode from "qrcode";
import JsBarcode from "jsbarcode";
import { createRoot } from 'react-dom/client';

type ImageFormat = 'png' | 'svg' | 'jpg' | 'eps';

export default function SequenceGenerator() {
  const [prefix, setPrefix] = useState<string>("");
  const [startNumber, setStartNumber] = useState<number>(1);
  const [increment, setIncrement] = useState<number>(1);
  const [padding, setPadding] = useState<number>(4);
  const [count, setCount] = useState<number>(1);
  const [format, setFormat] = useState<"qrcode" | "barcode">("barcode");
  const [barcodeType, setBarcodeType] = useState<string>("CODE128");
  const [previewCode, setPreviewCode] = useState<string>("");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [imageFormat, setImageFormat] = useState<ImageFormat>('png');
  
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const barcodeFormats = [
    { value: "CODE128", label: "Code 128 (default)" },
    { value: "EAN13", label: "EAN-13" },
    { value: "UPC", label: "UPC" },
    { value: "EAN8", label: "EAN-8" },
    { value: "CODE39", label: "Code 39" },
    { value: "ITF14", label: "ITF-14" },
    { value: "MSI", label: "MSI" },
    { value: "pharmacode", label: "Pharmacode" },
  ];

  const imageFormats = [
    { value: 'png', label: 'PNG' },
    { value: 'svg', label: 'SVG' },
    { value: 'jpg', label: 'JPG' },
    { value: 'eps', label: 'EPS' },
  ];
  
  // Generate preview whenever input values change
  useEffect(() => {
    if (prefix !== '' || startNumber > 0) {
      generatePreview();
    }
  }, [prefix, startNumber, padding, format, barcodeType]);

  const generatePreview = () => {
    const paddedNumber = String(startNumber).padStart(padding, '0');
    const code = `${prefix}${paddedNumber}`;
    setPreviewCode(code);
    
    if (format === "barcode" && barcodeCanvasRef.current) {
      try {
        JsBarcode(barcodeCanvasRef.current, code, {
          format: barcodeType,
          width: 2,
          height: 100,
          displayValue: true,
          lineColor: "#000000",
          background: "#FFFFFF",
        });
      } catch (err) {
        console.error("Error generating barcode", err);
      }
    }
    
    return code;
  };

  const generateSequence = () => {
    const sequences = [];
    let currentNumber = startNumber;
    
    for (let i = 0; i < count; i++) {
      const paddedNumber = String(currentNumber).padStart(padding, '0');
      const code = `${prefix}${paddedNumber}`;
      sequences.push(code);
      currentNumber += increment;
    }
    
    setGeneratedCodes(sequences);
    return sequences;
  };

  const downloadCode = async (codeValue: string, index: number) => {
    try {
      if (format === "qrcode") {
        if (imageFormat === 'svg') {
          // Create an SVG string from the QR code
          const svgString = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svgString.setAttribute('width', '256');
          svgString.setAttribute('height', '256');
          
          const qrElement = document.createElement('div');
          qrElement.style.display = 'inline-block';
          document.body.appendChild(qrElement);
          
          // Render QR code to the temporary div
          const qrComponent = <QRCode value={codeValue} size={256} level="M" />;
          // @ts-ignore - Using React DOM to render
          createRoot(qrElement).render(qrComponent);
          
          // Get the rendered SVG and convert to string
          const renderedSvg = qrElement.querySelector('svg');
          const svgContent = renderedSvg ? renderedSvg.outerHTML : '';
          document.body.removeChild(qrElement);
          
          // Download SVG
          const blob = new Blob([svgContent], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement("a");
          link.href = url;
          link.download = `qrcode-${index + 1}.svg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          const canvas = document.createElement("canvas");
          await qrcode.toCanvas(canvas, codeValue, {
            width: 256,
            margin: 1,
          });
          
          let mimeType = 'image/png';
          let fileExtension = 'png';
          
          if (imageFormat === 'jpg') {
            mimeType = 'image/jpeg';
            fileExtension = 'jpg';
          } else if (imageFormat === 'eps') {
            // For EPS we'll use PDF as a base and convert
            mimeType = 'application/pdf';
            fileExtension = 'eps';
          }
          
          const dataUrl = canvas.toDataURL(mimeType);
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = `qrcode-${index + 1}.${fileExtension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        // Barcode
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, codeValue, {
          format: barcodeType,
          width: 2,
          height: 100,
          displayValue: true,
          lineColor: "#000000",
          background: "#FFFFFF",
        });
        
        if (imageFormat === 'svg') {
          // Convert to SVG using the canvas data
          const barcodeData = canvas.toDataURL('image/png');
          const svgImage = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
              <image href="${barcodeData}" width="${canvas.width}" height="${canvas.height}"/>
            </svg>
          `;
          
          const blob = new Blob([svgImage], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement("a");
          link.href = url;
          link.download = `barcode-${index + 1}.svg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          let mimeType = 'image/png';
          let fileExtension = 'png';
          
          if (imageFormat === 'jpg') {
            mimeType = 'image/jpeg';
            fileExtension = 'jpg';
          } else if (imageFormat === 'eps') {
            // For EPS we'll use PDF as a base
            mimeType = 'application/pdf';
            fileExtension = 'eps';
          }
          
          const dataUrl = canvas.toDataURL(mimeType);
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = `barcode-${index + 1}.${fileExtension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (err) {
      console.error("Error downloading code", err);
    }
  };

  const downloadAll = async () => {
    const codes = generatedCodes.length > 0 ? generatedCodes : generateSequence();
    
    for (let i = 0; i < codes.length; i++) {
      await downloadCode(codes[i], i);
    }
  };

  const copyToClipboard = () => {
    const codes = generatedCodes.length > 0 ? generatedCodes : generateSequence();
    navigator.clipboard.writeText(codes.join('\n'))
      .then(() => alert('Codes copied to clipboard!'))
      .catch(err => console.error('Failed to copy: ', err));
  };

  return (
    <div className="w-full mx-auto bg-white rounded-lg shadow-md">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="code-format">
                Code Format
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="code-format"
                    value="barcode"
                    checked={format === "barcode"}
                    onChange={() => setFormat("barcode")}
                  />
                  <span className="ml-2">Barcode</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="code-format"
                    value="qrcode"
                    checked={format === "qrcode"}
                    onChange={() => setFormat("qrcode")}
                  />
                  <span className="ml-2">QR Code</span>
                </label>
              </div>
            </div>

            {format === "barcode" && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="barcode-type">
                  Barcode Format
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  id="barcode-type"
                  value={barcodeType}
                  onChange={(e) => setBarcodeType(e.target.value)}
                >
                  {barcodeFormats.map((format) => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prefix">
                Prefix (Optional)
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                id="prefix"
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g., PROD-"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="start-number">
                  Start Number
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  id="start-number"
                  type="number"
                  min="0"
                  value={startNumber}
                  onChange={(e) => setStartNumber(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="increment">
                  Increment By
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  id="increment"
                  type="number"
                  min="1"
                  value={increment}
                  onChange={(e) => setIncrement(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="padding">
                  Number Padding
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  id="padding"
                  type="number"
                  min="0"
                  max="10"
                  value={padding}
                  onChange={(e) => setPadding(Number(e.target.value))}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Number of digits (filled with leading zeros)
                </p>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="count">
                  Number of Codes
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  id="count"
                  type="number"
                  min="1"
                  max="1000"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image-format">
                Download Format
              </label>
              <div className="flex flex-wrap gap-3">
                {imageFormats.map((format) => (
                  <label key={format.value} className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="image-format"
                      value={format.value}
                      checked={imageFormat === format.value}
                      onChange={() => setImageFormat(format.value as ImageFormat)}
                    />
                    <span className="ml-2">{format.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={generateSequence}
              >
                Generate Sequence
              </button>
              <div className="relative">
                <button
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                  onClick={downloadAll}
                  disabled={generatedCodes.length === 0 && count === 0}
                >
                  <span>Download All</span>
                  <span className="ml-1">(.{imageFormat.toUpperCase()})</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Right Column - Preview */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex items-center justify-center mb-6">
              {previewCode ? (
                <div className="inline-block">
                  {format === "qrcode" ? (
                    <div className="p-4 bg-white rounded-md shadow-sm" ref={qrCodeRef}>
                      <QRCode
                        value={previewCode}
                        size={180}
                        level="M"
                      />
                      <div className="mt-2 text-center font-medium">{previewCode}</div>
                    </div>
                  ) : (
                    <div className="p-4 bg-white rounded-md shadow-sm">
                      <canvas ref={barcodeCanvasRef} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z" />
                  </svg>
                  <p>Fill the form to see your code</p>
                </div>
              )}
            </div>
            
            {generatedCodes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900">Generated Sequence</h3>
                  <button
                    className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                    onClick={copyToClipboard}
                  >
                    Copy All
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 max-h-64 overflow-y-auto">
                  <ul className="space-y-2">
                    {generatedCodes.slice(0, 100).map((code, index) => (
                      <li key={index} className="flex justify-between items-center text-sm p-2 hover:bg-gray-100 rounded">
                        <span>{code}</span>
                        <button
                          className="text-primary hover:text-blue-700 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                          onClick={() => downloadCode(code, index)}
                        >
                          Download .{imageFormat.toUpperCase()}
                        </button>
                      </li>
                    ))}
                    {generatedCodes.length > 100 && (
                      <li className="text-center text-xs text-gray-500">
                        Showing first 100 of {generatedCodes.length} codes
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 