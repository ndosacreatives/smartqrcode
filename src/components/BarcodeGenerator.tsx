"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import JsBarcode from "jsbarcode";
import jsPDF from 'jspdf';
import { useSubscription } from "@/context/SubscriptionContext";
import { useRouter } from "next/navigation";

type ImageFormat = 'png' | 'svg' | 'jpg' | 'eps' | 'pdf';

interface BarcodeGeneratorProps {
  onDownload?: (dataUrl: string) => void;
}

export default function BarcodeGenerator({ onDownload }: BarcodeGeneratorProps) {
  const router = useRouter();
  const { hasFeature, subscriptionTier, decrementDaily, remainingDaily } = useSubscription();
  const [text, setText] = useState<string>("");
  const [suffix, setSuffix] = useState<string>("");
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
  const barcodeFormats = useMemo(() => [
    { value: "CODE128", label: "Code 128 (default)", regex: /^[\x00-\x7F]*$/ },
    { value: "EAN13", label: "EAN-13", regex: /^\d{13}$/ },
    { value: "UPC", label: "UPC", regex: /^\d{12}$/ },
    { value: "EAN8", label: "EAN-8", regex: /^\d{8}$/ },
    { value: "CODE39", label: "Code 39", regex: /^[0-9A-Z\-\.\ \$\/\+\%]*$/ },
    { value: "ITF14", label: "ITF-14", regex: /^\d{14}$/ },
    { value: "MSI", label: "MSI", regex: /^\d+$/ },
    { value: "pharmacode", label: "Pharmacode", regex: /^\d+$/ },
  ], []);

  // List of supported image formats
  const imageFormats = [
    { value: 'png', label: 'PNG' },
    { value: 'svg', label: 'SVG' },
    { value: 'jpg', label: 'JPG' },
    { value: 'eps', label: 'EPS' },
    { value: 'pdf', label: 'PDF' },
  ];

  // Validate input based on barcode type
  const validateInput = useCallback((value: string, type: string) => {
    const format = barcodeFormats.find(f => f.value === type);
    if (!format) return false;
    
    if (format.regex.test(value)) {
      setErrorMessage("");
      return true;
    } else {
      setErrorMessage(`Invalid format for ${format.label}`);
      return false;
    }
  }, [barcodeFormats, setErrorMessage]);

  // Generate barcode whenever parameters change
  useEffect(() => {
    const valueToEncode = text + suffix;
    if (valueToEncode.trim() !== "" && canvasRef.current) {
      try {
        if (validateInput(valueToEncode, barcodeType)) {
          JsBarcode(canvasRef.current, valueToEncode, {
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
  }, [text, suffix, barcodeType, width, height, displayValue, foregroundColor, backgroundColor, marginTop, marginBottom, validateInput]);

  const generateBarcode = () => {
    if (canvasRef.current) {
      try {
        // Generate barcode with specified options
        JsBarcode(canvasRef.current, text + suffix, {
          format: barcodeType,
          width,
          height,
          displayValue,
          marginTop,
          marginBottom,
          lineColor: foregroundColor,
          background: backgroundColor,
        });
      } catch (e) {
        console.error("Failed to generate barcode:", e);
        alert("Failed to generate barcode. Please check your input.");
      }
    }
  };

  const downloadBarcode = () => {
    if (canvasRef.current) {
      try {
        // For free users, decrement daily limit and enforce low resolution for JPEG
        if (subscriptionTier === "free") {
          decrementDaily();
          
          // Force low resolution JPEG for free users
          const canvas = canvasRef.current as HTMLCanvasElement;
          const resizedCanvas = document.createElement("canvas");
          // Low resolution output - approximately 72dpi quality
          const scaleFactor = 0.5;
          resizedCanvas.width = canvas.width * scaleFactor;
          resizedCanvas.height = canvas.height * scaleFactor;
          const ctx = resizedCanvas.getContext("2d");
          ctx?.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
          
          // Force JPEG format for free users
          const dataUrl = resizedCanvas.toDataURL("image/jpeg", 0.7);
          const downloadLink = document.createElement("a");
          downloadLink.href = dataUrl;
          downloadLink.download = `barcode-${barcodeType.toLowerCase()}-${text + suffix}.jpg`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } else {
          // Paid users get full resolution and format options
          const canvas = canvasRef.current as HTMLCanvasElement;
          let dataUrl;
          let extension;
          
          // Allow different formats for paid users
          if (imageFormat === "svg" && hasFeature("svgDownload")) {
            // SVG export logic (requires converting canvas to SVG)
            // This would require additional libraries in a real implementation
            alert("SVG export not implemented in this demo");
            return;
          } else if (imageFormat === "pdf" && hasFeature("pdfDownload")) {
            // PDF export logic would go here
            alert("PDF export not implemented in this demo");
            return;
          } else {
            // Default to high-quality PNG/JPEG for paid users
            const mimeType = imageFormat === "jpg" ? "image/jpeg" : "image/png";
            const quality = imageFormat === "jpg" ? 1.0 : undefined;
            dataUrl = canvas.toDataURL(mimeType, quality);
            extension = imageFormat;
          }
          
          // Download the file
          const downloadLink = document.createElement("a");
          downloadLink.href = dataUrl;
          downloadLink.download = `barcode-${barcodeType.toLowerCase()}-${text + suffix}.${extension}`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      } catch (e) {
        console.error("Failed to download barcode:", e);
      }
    }
  };

  return (
    <div className="w-full mx-auto bg-white rounded-lg shadow-lg p-6 border border-zinc-200">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Barcode Generator</h2>
        <p className="text-gray-600">Create various standard barcodes.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
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
          
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="barcode-suffix">
              Suffix (Optional)
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              id="barcode-suffix"
              type="text"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              placeholder="Enter optional suffix"
            />
          </div>
          
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
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
          
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 mb-4">
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
          
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image-format">
              Download Format
            </label>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="image-format"
                  value="jpg"
                  checked={imageFormat === "jpg" || subscriptionTier === "free"}
                  onChange={() => setImageFormat("jpg")}
                />
                <span className="ml-2">JPEG</span>
                {subscriptionTier === "free" && (
                  <span className="ml-1 text-xs text-gray-600">(Low Resolution)</span>
                )}
              </label>
              
              <label className={`inline-flex items-center ${!hasFeature("svgDownload") ? "opacity-50" : ""}`}>
                <input
                  type="radio"
                  className="form-radio"
                  name="image-format"
                  value="png"
                  checked={imageFormat === "png"}
                  onChange={() => setImageFormat("png")}
                  disabled={!hasFeature("svgDownload")}
                />
                <span className="ml-2">PNG</span>
                {!hasFeature("svgDownload") && (
                  <span className="ml-1 text-xs text-blue-600 font-semibold">PRO</span>
                )}
              </label>
              
              <label className={`inline-flex items-center ${!hasFeature("svgDownload") ? "opacity-50" : ""}`}>
                <input
                  type="radio"
                  className="form-radio"
                  name="image-format"
                  value="svg"
                  checked={imageFormat === "svg"}
                  onChange={() => setImageFormat("svg")}
                  disabled={!hasFeature("svgDownload")}
                />
                <span className="ml-2">SVG</span>
                {!hasFeature("svgDownload") && (
                  <span className="ml-1 text-xs text-blue-600 font-semibold">PRO</span>
                )}
              </label>
              
              <label className={`inline-flex items-center ${!hasFeature("pdfDownload") ? "opacity-50" : ""}`}>
                <input
                  type="radio"
                  className="form-radio"
                  name="image-format"
                  value="pdf"
                  checked={imageFormat === "pdf"}
                  onChange={() => setImageFormat("pdf")}
                  disabled={!hasFeature("pdfDownload")}
                />
                <span className="ml-2">PDF</span>
                {!hasFeature("pdfDownload") && (
                  <span className="ml-1 text-xs text-blue-600 font-semibold">PRO</span>
                )}
              </label>
            </div>
          </div>
          
          <button
            className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center"
            onClick={generateBarcode}
            disabled={!text || !!errorMessage}
          >
            <span>Generate Barcode</span>
          </button>
          
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center"
            onClick={downloadBarcode}
            disabled={!text || !!errorMessage}
          >
            <span>Download Barcode</span>
            <span className="ml-2">(.{imageFormat.toUpperCase()})</span>
          </button>
          
          {/* Remaining daily count for free users */}
          {subscriptionTier === "free" && (
            <div className="mt-4 text-xs text-amber-600 bg-amber-50 p-2 rounded-md text-center">
              {remainingDaily <= 5 ? (
                <>
                  You have {remainingDaily} barcodes remaining today.  
                  <button 
                    onClick={() => router.push('/pricing')} 
                    className="ml-1 underline"
                  >
                    Upgrade for unlimited.
                  </button>
                </>
              ) : (
                <>Free tier: Limited to low-resolution JPEG</>
              )}
            </div>
          )}
        </div>
        
        {/* Right Column - Preview */}
        <div className="space-y-4">
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 text-center">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Preview</h3>
            {(text + suffix).trim() === "" ? (
              <div className="flex items-center justify-center h-32 bg-gray-200 rounded-md text-gray-500">
                Enter value to preview
              </div>
            ) : (
              <canvas ref={canvasRef} className="mx-auto border border-gray-300"></canvas>
            )}
            {errorMessage && (
              <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            {(text+suffix) && !errorMessage && `Type: ${barcodeFormats.find(f => f.value === barcodeType)?.label}`}
          </p>
        </div>
      </div>
    </div>
  );
} 