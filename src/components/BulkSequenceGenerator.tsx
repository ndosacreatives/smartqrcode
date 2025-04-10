"use client";

import React, { useState, useRef } from "react";
import * as qrcode from "qrcode";
import JsBarcode from "jsbarcode";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function BulkSequenceGenerator() {
  const [prefix, setPrefix] = useState<string>("");
  const [startNumber, setStartNumber] = useState<number>(1);
  const [increment, setIncrement] = useState<number>(1);
  const [padding, setPadding] = useState<number>(4);
  const [count, setCount] = useState<number>(50);
  const [format, setFormat] = useState<"qrcode" | "barcode">("barcode");
  const [barcodeType, setBarcodeType] = useState<string>("CODE128");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [downloadLink, setDownloadLink] = useState<string>("");
  
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

  const generateSequence = () => {
    const sequences = [];
    let currentNumber = startNumber;
    
    for (let i = 0; i < count; i++) {
      const paddedNumber = String(currentNumber).padStart(padding, '0');
      const code = `${prefix}${paddedNumber}`;
      sequences.push(code);
      currentNumber += increment;
    }
    
    return sequences;
  };

  const generateBulkCodes = async () => {
    setIsGenerating(true);
    setProgress(0);
    setDownloadLink("");
    
    try {
      const codes = generateSequence();
      const zip = new JSZip();
      const folder = format === "qrcode" ? zip.folder("qrcodes") : zip.folder("barcodes");
      
      if (!folder) {
        throw new Error("Could not create folder in ZIP");
      }
      
      // Create a text file with all codes
      folder.file("all_codes.txt", codes.join("\n"));
      
      // Generate files in batches to avoid browser freezing
      const batchSize = 10;
      const batches = Math.ceil(codes.length / batchSize);
      
      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const batchStart = batchIndex * batchSize;
        const batchEnd = Math.min((batchIndex + 1) * batchSize, codes.length);
        const batch = codes.slice(batchStart, batchEnd);
        
        // Process each code in the batch
        for (let i = 0; i < batch.length; i++) {
          const code = batch[i];
          const index = batchStart + i;
          let dataUrl;
          
          if (format === "qrcode") {
            const canvas = document.createElement("canvas");
            await qrcode.toCanvas(canvas, code, {
              width: 256,
              margin: 1,
            });
            dataUrl = canvas.toDataURL("image/png").split(',')[1];
          } else {
            const canvas = document.createElement("canvas");
            JsBarcode(canvas, code, {
              format: barcodeType,
              width: 2,
              height: 100,
              displayValue: true,
              lineColor: "#000000",
              background: "#FFFFFF",
            });
            dataUrl = canvas.toDataURL("image/png").split(',')[1];
          }
          
          // Add the image to the ZIP file
          const fileName = `${format === "qrcode" ? "qrcode" : "barcode"}-${index + 1}.png`;
          folder.file(fileName, dataUrl, { base64: true });
          
          // Update progress
          const totalProgress = ((index + 1) / codes.length) * 100;
          setProgress(Math.round(totalProgress));
        }
        
        // Allow UI to update before processing next batch
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      // Generate the ZIP file
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      setDownloadLink(url);
      
      // Automatically download
      saveAs(content, `${format === "qrcode" ? "qrcodes" : "barcodes"}-bulk.zip`);
    } catch (error) {
      console.error("Error generating bulk codes:", error);
      alert("An error occurred while generating codes. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full mx-auto bg-white rounded-lg shadow-md">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Bulk Sequence Generator</h2>
          <p className="text-gray-600">Generate and download multiple codes at once as a ZIP file.</p>
        </div>
        
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
                    disabled={isGenerating}
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
                    disabled={isGenerating}
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
                  disabled={isGenerating}
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
                disabled={isGenerating}
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
                  disabled={isGenerating}
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
                  disabled={isGenerating}
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
                  disabled={isGenerating}
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
                  disabled={isGenerating}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Max 1000 codes per batch
                </p>
              </div>
            </div>
            
            <button
              className={`w-full font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline ${
                isGenerating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-blue-700 text-white"
              }`}
              onClick={generateBulkCodes}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Bulk Codes"}
            </button>
          </div>
          
          {/* Right Column - Preview & Status */}
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Generation</h3>
              
              {isGenerating ? (
                <div className="space-y-4">
                  <p className="text-gray-600">Generating {count} codes...</p>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-primary h-4 rounded-full transition-all duration-300 ease-in-out" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 text-center">{progress}% complete</p>
                </div>
              ) : downloadLink ? (
                <div className="space-y-4 text-center">
                  <div className="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-green-500 mb-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium">Generation Complete!</p>
                  <p className="text-gray-600 text-sm mb-3">
                    {count} {format === "qrcode" ? "QR codes" : "barcodes"} have been generated and packaged as a ZIP file.
                  </p>
                  <a
                    href={downloadLink}
                    download={`${format === "qrcode" ? "qrcodes" : "barcodes"}-bulk.zip`}
                    className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Download ZIP Again
                  </a>
                </div>
              ) : (
                <div className="text-center py-10">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400 mb-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <p className="text-gray-500">
                    Configure your settings and click "Generate Bulk Codes" to start.
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    All codes will be saved as individual image files in a ZIP archive.
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sample Codes</h3>
              <p className="text-gray-500 text-sm mb-3">
                Here are examples of the first few codes that will be generated:
              </p>
              <div className="space-y-1 text-sm">
                {generateSequence().slice(0, 5).map((code, index) => (
                  <div key={index} className="p-2 bg-white rounded border border-gray-200">
                    {code}
                  </div>
                ))}
                {count > 5 && (
                  <div className="text-center text-gray-400 text-xs mt-2">
                    +{count - 5} more codes will be generated
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 