"use client";

import React, { useState, useRef, useEffect } from "react";
import QRCode from "react-qr-code";
import * as qrcode from "qrcode";
import JsBarcode from "jsbarcode";
import { createRoot } from 'react-dom/client';
import jsPDF from 'jspdf';

type ImageFormat = 'png' | 'svg' | 'jpg' | 'eps' | 'pdf';

export default function SequenceGenerator() {
  const [prefix, setPrefix] = useState<string>("");
  const [startNumber, setStartNumber] = useState<number>(1);
  const [increment, setIncrement] = useState<number>(1);
  const [padding, setPadding] = useState<number>(4);
  const [suffix, setSuffix] = useState<string>("");
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
    { value: 'pdf', label: 'PDF' },
  ];
  
  // Generate preview whenever input values change
  useEffect(() => {
    const generatePreview = () => {
      const paddedNumber = String(startNumber).padStart(padding, '0');
      const code = `${prefix}${paddedNumber}${suffix}`;
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

    if (prefix !== '' || startNumber > 0) {
      generatePreview();
    }
  }, [prefix, startNumber, padding, format, barcodeType, barcodeCanvasRef, suffix]);

  const generateSequence = () => {
    const sequences = [];
    let currentNumber = startNumber;
    
    for (let i = 0; i < count; i++) {
      const paddedNumber = String(currentNumber).padStart(padding, '0');
      const code = `${prefix}${paddedNumber}${suffix}`;
      sequences.push(code);
      currentNumber += increment;
    }
    
    setGeneratedCodes(sequences);
    return sequences;
  };

  const downloadCode = async (codeValue: string, index: number) => {
    try {
      const canvas = document.createElement("canvas");
      let imageDataUrl: string | null = null;
      let isSvg = false;
      let svgString = '';

      if (format === "qrcode") {
        if (imageFormat === 'svg') {
          isSvg = true;
          // Create SVG string (rendered in a temporary element)
          const qrElement = document.createElement('div');
          qrElement.style.display = 'inline-block';
          document.body.appendChild(qrElement);
          const qrComponent = <QRCode value={codeValue} size={256} level="M" />;
          createRoot(qrElement).render(qrComponent);
          const renderedSvg = qrElement.querySelector('svg');
          svgString = renderedSvg ? renderedSvg.outerHTML : '';
          document.body.removeChild(qrElement);
        } else {
          await qrcode.toCanvas(canvas, codeValue, { width: 256, margin: 1 });
          imageDataUrl = canvas.toDataURL('image/png'); // Use PNG as base for PDF
        }
      } else {
        // Barcode
        JsBarcode(canvas, codeValue, { format: barcodeType, width: 2, height: 100, displayValue: true, lineColor: "#000000", background: "#FFFFFF" });
        if (imageFormat === 'svg') {
          isSvg = true;
          const barcodeData = canvas.toDataURL('image/png');
          svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}"><image href="${barcodeData}" width="${canvas.width}" height="${canvas.height}"/></svg>`;
        } else {
          imageDataUrl = canvas.toDataURL('image/png'); // Use PNG as base for PDF
        }
      }

      // --- Download Logic --- 
      const downloadFileName = `${format === "qrcode" ? "qrcode" : "barcode"}-${index + 1}`;

      if (imageFormat === 'pdf') {
         if (!imageDataUrl) {
           alert("Cannot generate PDF from SVG directly yet. Please choose PNG or JPG as base.");
           // TODO: Could implement SVG to PDF conversion if needed
           return;
         }
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        
        const availableWidth = pdfWidth - margin * 2;
        const availableHeight = pdfHeight - margin * 2;
        let imgWidth = canvas.width * 0.264583;
        let imgHeight = canvas.height * 0.264583;
        const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
        imgWidth *= ratio;
        imgHeight *= ratio;
        
        const xPos = (pdfWidth - imgWidth) / 2;
        const yPos = (pdfHeight - imgHeight) / 2;
        
        pdf.addImage(imageDataUrl, 'PNG', xPos, yPos, imgWidth, imgHeight);
        pdf.save(`${downloadFileName}.pdf`);

      } else if (isSvg) {
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${downloadFileName}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (imageDataUrl) {
        let mimeType = 'image/png';
        let fileExtension = 'png';
        if (imageFormat === 'jpg') {
          mimeType = 'image/jpeg';
          fileExtension = 'jpg';
        } else if (imageFormat === 'eps') {
          // Basic EPS handling (might need refinement)
          mimeType = 'application/postscript'; 
          fileExtension = 'eps';
        }
        const dataUrl = canvas.toDataURL(mimeType); // Re-encode if needed
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${downloadFileName}.${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (err) {
      console.error("Error downloading code", err);
      alert("Failed to download code.");
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
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="suffix">
                Suffix (Optional)
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                id="suffix"
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="e.g., -V1"
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
              <select
                id="image-format"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={imageFormat}
                onChange={(e) => setImageFormat(e.target.value as ImageFormat)}
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="svg">SVG</option>
                <option value="eps">EPS</option>
                <option value="pdf">PDF</option>
              </select>
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