"use client";

import React, { useState, useRef, useEffect } from "react";
import JsBarcode from "jsbarcode";

type ImageFormat = 'png' | 'svg' | 'jpg' | 'eps';

interface BarcodeGeneratorProps {
  onDownload?: (dataUrl: string) => void;
}

export default function BarcodeGenerator({ onDownload }: BarcodeGeneratorProps) {
  const [text, setText] = useState<string>("");
  const [barcodeType, setBarcodeType] = useState<string>("CODE128");
  const [width, setWidth] = useState<number>(2);
  const [height, setHeight] = useState<number>(100);
  const [displayValue, setDisplayValue] = useState<boolean>(true);
  const [foregroundColor, setForegroundColor] = useState<string>("#000000");
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
  const [marginTop, setMarginTop] = useState<number>(10);
  const [marginBottom, setMarginBottom] = useState<number>(10);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [imageFormat, setImageFormat] = useState<ImageFormat>('png');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // List of supported barcode formats
  const barcodeFormats = [
    { value: "CODE128", label: "Code 128 (default)", regex: /^[\x00-\x7F]*$/ },
    { value: "EAN13", label: "EAN-13", regex: /^\d{13}$/ },
    { value: "UPC", label: "UPC", regex: /^\d{12}$/ },
    { value: "EAN8", label: "EAN-8", regex: /^\d{8}$/ },
    { value: "CODE39", label: "Code 39", regex: /^[0-9A-Z\-\.\ \$\/\+\%]*$/ },
    { value: "ITF14", label: "ITF-14", regex: /^\d{14}$/ },
    { value: "MSI", label: "MSI", regex: /^\d+$/ },
    { value: "pharmacode", label: "Pharmacode", regex: /^\d+$/ },
  ];

  // List of supported image formats
  const imageFormats = [
    { value: 'png', label: 'PNG' },
    { value: 'svg', label: 'SVG' },
    { value: 'jpg', label: 'JPG' },
    { value: 'eps', label: 'EPS' },
  ];

  // Validate input based on barcode type
  const validateInput = (value: string, type: string) => {
    const format = barcodeFormats.find(f => f.value === type);
    if (!format) return false;
    
    if (format.regex.test(value)) {
      setErrorMessage("");
      return true;
    } else {
      setErrorMessage(`Invalid format for ${format.label}`);
      return false;
    }
  };

  // Generate barcode whenever parameters change
  useEffect(() => {
    if (text.trim() !== "" && canvasRef.current) {
      try {
        if (validateInput(text, barcodeType)) {
          JsBarcode(canvasRef.current, text, {
            format: barcodeType,
            width,
            height,
            displayValue,
            marginTop,
            marginBottom,
            lineColor: foregroundColor,
            background: backgroundColor,
          });
        }
      } catch (err) {
        console.error("Error generating barcode", err);
        setErrorMessage("Failed to generate barcode. Please check your input.");
      }
    }
  }, [text, barcodeType, width, height, displayValue, foregroundColor, backgroundColor, marginTop, marginBottom]);

  const downloadBarcode = () => {
    if (!canvasRef.current || text.trim() === "") return;
    
    try {
      if (imageFormat === 'svg') {
        // Create an SVG from the canvas
        const canvas = canvasRef.current;
        const imageData = canvas.toDataURL('image/png');
        
        const svgImage = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
            <image href="${imageData}" width="${canvas.width}" height="${canvas.height}"/>
          </svg>
        `;
        
        const blob = new Blob([svgImage], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `barcode-${barcodeType.toLowerCase()}.svg`;
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
        
        const dataUrl = canvasRef.current.toDataURL(mimeType);
        
        if (onDownload) {
          onDownload(dataUrl);
        } else {
          // Default download behavior
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = `barcode-${barcodeType.toLowerCase()}.${fileExtension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (err) {
      console.error("Error downloading barcode", err);
    }
  };

  return (
    <div className="w-full mx-auto bg-white rounded-lg shadow-md">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="barcode-text">
                Barcode Value <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                id="barcode-text"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter barcode value"
              />
              {errorMessage && (
                <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
              )}
            </div>
            
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
              <p className="mt-1 text-sm text-gray-500">
                {barcodeType === "CODE128" && "Accepts any ASCII character"}
                {barcodeType === "EAN13" && "Must be exactly 13 digits"}
                {barcodeType === "UPC" && "Must be exactly 12 digits"}
                {barcodeType === "EAN8" && "Must be exactly 8 digits"}
                {barcodeType === "CODE39" && "Accepts 0-9, A-Z, -, ., space, $, /, +, %"}
                {barcodeType === "ITF14" && "Must be exactly 14 digits"}
                {barcodeType === "MSI" && "Accepts only digits"}
                {barcodeType === "pharmacode" && "Accepts only digits"}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="barcode-width">
                  Bar Width: {width}
                </label>
                <input
                  className="w-full"
                  id="barcode-width"
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="barcode-height">
                  Height: {height}px
                </label>
                <input
                  className="w-full"
                  id="barcode-height"
                  type="range"
                  min="50"
                  max="200"
                  step="10"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="margin-top">
                  Top Margin: {marginTop}px
                </label>
                <input
                  className="w-full"
                  id="margin-top"
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={marginTop}
                  onChange={(e) => setMarginTop(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="margin-bottom">
                  Bottom Margin: {marginBottom}px
                </label>
                <input
                  className="w-full"
                  id="margin-bottom"
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={marginBottom}
                  onChange={(e) => setMarginBottom(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fg-color">
                  Foreground Color
                </label>
                <input
                  className="w-full"
                  id="fg-color"
                  type="color"
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bg-color">
                  Background Color
                </label>
                <input
                  className="w-full"
                  id="bg-color"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={displayValue}
                  onChange={(e) => setDisplayValue(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-700 text-sm font-bold">Show Text Below Barcode</span>
              </label>
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
            
            <button
              className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center"
              onClick={downloadBarcode}
              disabled={!text || !!errorMessage}
            >
              <span>Download Barcode</span>
              <span className="ml-2">(.{imageFormat.toUpperCase()})</span>
            </button>
          </div>
          
          {/* Right Column - Preview */}
          <div className="flex flex-col items-center justify-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Barcode Preview</h3>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex items-center justify-center w-full h-full">
              {text && !errorMessage ? (
                <div className="inline-block p-4 bg-white rounded-md shadow-sm overflow-hidden max-w-full">
                  <canvas ref={canvasRef} />
                </div>
              ) : (
                <div className="text-gray-400 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z" />
                  </svg>
                  <p>Fill the form to generate a barcode</p>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {text && !errorMessage && `Type: ${barcodeFormats.find(f => f.value === barcodeType)?.label}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 