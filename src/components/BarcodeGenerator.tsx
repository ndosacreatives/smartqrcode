"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import JsBarcode from "jsbarcode";
import { useSubscription } from "@/context/SubscriptionProvider";
import { useRouter } from "next/navigation";
import { useTrackUsage } from "@/hooks/useTrackUsage";

type ImageFormat = 'png' | 'svg' | 'jpg' | 'eps' | 'pdf';

interface BarcodeGeneratorProps {
  onDownload?: (dataUrl: string) => void;
}

export default function BarcodeGenerator({ onDownload }: BarcodeGeneratorProps) {
  const router = useRouter();
  const { subscriptionTier } = useSubscription();
  
  // Use the tracking hook
  const {
    trackUsage,
    error: trackingError,
    canUseFeature,
    getRemainingUsage,
  } = useTrackUsage();
  
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
  // const imageFormats = [
  //   { value: 'png', label: 'PNG' },
  //   { value: 'svg', label: 'SVG' },
  //   { value: 'jpg', label: 'JPG' },
  //   { value: 'eps', label: 'EPS' },
  //   { value: 'pdf', label: 'PDF' },
  // ];

  // Validate the barcode text based on the selected format
  useEffect(() => {
    if (!text) {
      setErrorMessage("");
      return;
    }

    const selectedFormat = barcodeFormats.find(f => f.value === barcodeType);
    if (selectedFormat && !selectedFormat.regex.test(text)) {
      setErrorMessage(`Invalid format for ${selectedFormat.label}`);
    } else {
      setErrorMessage("");
    }
  }, [text, barcodeType, barcodeFormats]);

  // Generate the barcode when inputs change
  const generateBarcode = useCallback(() => {
    if (canvasRef.current && text && !errorMessage) {
      try {
        JsBarcode(canvasRef.current, text, {
          format: barcodeType,
          displayValue,
          width,
          height,
          margin: 0,
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
  }, [text, barcodeType, width, height, displayValue, foregroundColor, backgroundColor, marginTop, marginBottom, errorMessage]);

  useEffect(() => {
    if (text && !errorMessage && canvasRef.current) {
      generateBarcode();
    }
  }, [text, errorMessage, canvasRef, generateBarcode]);

  const downloadBarcode = async () => {
    if (canvasRef.current) {
      try {
        // Check if user can generate barcode
        const remainingBarcodes = getRemainingUsage('barcodesGenerated');
        
        if (remainingBarcodes <= 0) {
          alert(`You've reached your barcode generation limit for your ${subscriptionTier} plan. Please upgrade to continue.`);
          router.push('/pricing');
          return;
        }
        
        // Track usage before generating
        const trackSuccess = await trackUsage('barcodesGenerated');
        
        if (!trackSuccess) {
          if (trackingError) {
            alert(trackingError);
          }
          return;
        }
        
        // Process based on image format
        const canvas = canvasRef.current as HTMLCanvasElement;
        let dataUrl;
        let extension;
        
        // Check premium formats
        if (imageFormat === "svg" && !canUseFeature('barcodesGenerated')) {
          alert("SVG format requires a premium subscription. Please upgrade your plan.");
          router.push('/pricing');
          return;
        } else if (imageFormat === "pdf" && !canUseFeature('barcodesGenerated')) {
          alert("PDF format requires a premium subscription. Please upgrade your plan.");
          router.push('/pricing');
          return;
        }
        
        // Process the different formats
        if (imageFormat === "svg") {
          // SVG export logic (simplified for this example)
          alert("SVG export not implemented in this demo");
          return;
        } else if (imageFormat === "pdf") {
          // PDF export logic (simplified for this example)
          alert("PDF export not implemented in this demo");
          return;
        } else {
          // Default to PNG/JPEG 
          const mimeType = imageFormat === "jpg" ? "image/jpeg" : "image/png";
          const quality = imageFormat === "jpg" ? 1.0 : undefined;
          
          // For free tier, reduce quality
          if (subscriptionTier === "free" && imageFormat === "jpg") {
            const resizedCanvas = document.createElement("canvas");
            const scaleFactor = 0.5;
            resizedCanvas.width = canvas.width * scaleFactor;
            resizedCanvas.height = canvas.height * scaleFactor;
            const ctx = resizedCanvas.getContext("2d");
            ctx?.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
            dataUrl = resizedCanvas.toDataURL(mimeType, 0.7);
          } else {
            dataUrl = canvas.toDataURL(mimeType, quality);
          }
          
          extension = imageFormat;
        }
        
        // Download the file
        if (onDownload && dataUrl) {
          onDownload(dataUrl);
        } else if (dataUrl) {
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
              
              <label className={`inline-flex items-center ${!canUseFeature('barcodesGenerated') ? "opacity-50" : ""}`}>
                <input
                  type="radio"
                  className="form-radio"
                  name="image-format"
                  value="png"
                  checked={imageFormat === "png"}
                  onChange={() => setImageFormat("png")}
                  disabled={!canUseFeature('barcodesGenerated')}
                />
                <span className="ml-2">PNG</span>
                {!canUseFeature('barcodesGenerated') && (
                  <span className="ml-1 text-xs text-blue-600 font-semibold">PRO</span>
                )}
              </label>
              
              <label className={`inline-flex items-center ${!canUseFeature('barcodesGenerated') ? "opacity-50" : ""}`}>
                <input
                  type="radio"
                  className="form-radio"
                  name="image-format"
                  value="svg"
                  checked={imageFormat === "svg"}
                  onChange={() => setImageFormat("svg")}
                  disabled={!canUseFeature('barcodesGenerated')}
                />
                <span className="ml-2">SVG</span>
                {!canUseFeature('barcodesGenerated') && (
                  <span className="ml-1 text-xs text-blue-600 font-semibold">PRO</span>
                )}
              </label>
              
              <label className={`inline-flex items-center ${!canUseFeature('barcodesGenerated') ? "opacity-50" : ""}`}>
                <input
                  type="radio"
                  className="form-radio"
                  name="image-format"
                  value="pdf"
                  checked={imageFormat === "pdf"}
                  onChange={() => setImageFormat("pdf")}
                  disabled={!canUseFeature('barcodesGenerated')}
                />
                <span className="ml-2">PDF</span>
                {!canUseFeature('barcodesGenerated') && (
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