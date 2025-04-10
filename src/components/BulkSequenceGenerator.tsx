"use client";

import React, { useState, useEffect, useCallback } from "react";
import * as qrcode from "qrcode";
import JsBarcode from "jsbarcode";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import jsPDF from 'jspdf';

export default function BulkSequenceGenerator() {
  const [prefix, setPrefix] = useState<string>("");
  const [suffix, setSuffix] = useState<string>("");
  const [startNumber, setStartNumber] = useState<number>(1);
  const [increment, setIncrement] = useState<number>(1);
  const [padding, setPadding] = useState<number>(4);
  const [count, setCount] = useState<number>(50);
  const [format, setFormat] = useState<"qrcode" | "barcode">("barcode");
  const [barcodeType, setBarcodeType] = useState<string>("CODE128");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [downloadLink, setDownloadLink] = useState<string>("");
  const [outputType, setOutputType] = useState<'zip' | 'pdf' | 'pdf-tile'>('zip');

  // PDF Layout State
  const [paperSize, setPaperSize] = useState<string>('a4'); // a4, a5, a3, custom
  const [orientation, setOrientation] = useState<'p' | 'l'>('p'); // portrait, landscape
  const [customWidth, setCustomWidth] = useState<number>(210); // mm
  const [customHeight, setCustomHeight] = useState<number>(297); // mm
  const [columns, setColumns] = useState<number>(4);
  const [rows, setRows] = useState<number>(10);
  const [marginTop, setMarginTop] = useState<number>(10); // mm
  const [marginLeft, setMarginLeft] = useState<number>(10); // mm
  const [spacing, setSpacing] = useState<number>(5); // mm

  // Tiling State (for PDF Tile download)
  const [tileColumns, setTileColumns] = useState<number>(4); // Changed default
  const [tileRows, setTileRows] = useState<number>(10);
  const [tileSpacing, setTileSpacing] = useState<number>(5);
  const [tileSpacingUnit, setTileSpacingUnit] = useState<'mm' | 'cm'>('mm');
  const [addOutline, setAddOutline] = useState<boolean>(false); // Option to add border
  const [displayGridWidth, setDisplayGridWidth] = useState<string>("0");
  const [displayGridHeight, setDisplayGridHeight] = useState<string>("0");

  // Add state for preview code images
  const [previewCodeImages, setPreviewCodeImages] = useState<(string | null)[]>([]);

  // Add a state variable for barcode height
  const [barcodeHeight, setBarcodeHeight] = useState<number>(4); // Default to 4

  // Add a state variable for barcode height unit
  const [barcodeHeightUnit, setBarcodeHeightUnit] = useState<'px' | 'cm' | 'mm'>('cm'); // Default to cm

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

  // Conversion Factors
  const PX_PER_CM = 37.7953;
  const PX_PER_MM = 3.77953;

  // Generalized unit conversion function
  const convertUnits = (value: number, fromUnit: string, toUnit: string): number => {
    if (fromUnit === toUnit) return value;

    let valueInPx: number;

    // Convert input value to pixels first
    switch (fromUnit) {
      case 'cm': valueInPx = value * PX_PER_CM; break;
      case 'mm': valueInPx = value * PX_PER_MM; break;
      case 'px': 
      default:   valueInPx = value; break;
    }

    // Convert from pixels to the target unit
    let convertedValue: number;
    switch (toUnit) {
      case 'cm': convertedValue = valueInPx / PX_PER_CM; break;
      case 'mm': convertedValue = valueInPx / PX_PER_MM; break;
      case 'px': 
      default:   convertedValue = valueInPx; break;
    }
    
    // Round to reasonable precision (e.g., 1 decimal for cm/mm, 0 for px)
    return Number(convertedValue.toFixed(toUnit === 'px' ? 0 : 1));
  };

  // Handler for unit change - converts the current height value
  const handleUnitChange = (newUnit: 'px' | 'cm' | 'mm') => {
    const currentHeight = barcodeHeight; // Get value from state
    const currentUnit = barcodeHeightUnit; // Get unit from state
    
    const newHeightValue = convertUnits(currentHeight, currentUnit, newUnit);
    
    setBarcodeHeight(newHeightValue);
    setBarcodeHeightUnit(newUnit);
  };

  // Wrap generateSequence in useCallback to stabilize its reference
  const generateSequence = useCallback(() => {
    const sequences = [];
    let currentNumber = startNumber;
    
    for (let i = 0; i < count; i++) {
      const paddedNumber = String(currentNumber).padStart(padding, '0');
      const code = `${prefix}${paddedNumber}${suffix}`;
      sequences.push(code);
      currentNumber += increment;
    }
    
    return sequences;
  }, [prefix, suffix, startNumber, padding, count, increment]); // Add dependencies

  const generateBulkCodes = async () => {
    setIsGenerating(true);
    setProgress(0);
    setDownloadLink("");
    
    try {
      const codes = generateSequence();
      
      if (outputType === 'zip') {
        // --- ZIP Generation Logic --- 
        const zip = new JSZip();
        const folder = format === "qrcode" ? zip.folder("qrcodes") : zip.folder("barcodes");
        
        if (!folder) {
          throw new Error("Could not create folder in ZIP");
        }
        
        folder.file("all_codes.txt", codes.join("\n"));
        
        const batchSize = 10;
        const batches = Math.ceil(codes.length / batchSize);
        
        for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
          const batchStart = batchIndex * batchSize;
          const batchEnd = Math.min((batchIndex + 1) * batchSize, codes.length);
          const batch = codes.slice(batchStart, batchEnd);
          
          for (let i = 0; i < batch.length; i++) {
            const code = batch[i];
            const index = batchStart + i;
            const canvas = document.createElement("canvas");
            if (format === "qrcode") {
              await qrcode.toCanvas(canvas, code, { width: 256, margin: 1 });
            } else {
              // Use convertUnits to get pixel height for JsBarcode
              JsBarcode(canvas, code, { format: barcodeType, width: 2, height: convertUnits(barcodeHeight, barcodeHeightUnit, 'px'), displayValue: true, lineColor: "#000000", background: "#FFFFFF" });
            }
            const dataUrl = canvas.toDataURL("image/png").split(',')[1];
            
            const fileName = `${format === "qrcode" ? "qrcode" : "barcode"}-${index + 1}.png`;
            folder.file(fileName, dataUrl, { base64: true });
            
            const totalProgress = ((index + 1) / codes.length) * 100;
            setProgress(Math.round(totalProgress));
          }
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${format === "qrcode" ? "qrcodes" : "barcodes"}-bulk.zip`);
        // Optionally set a download link if needed
        // const url = URL.createObjectURL(content);
        // setDownloadLink(url);

      } else if (outputType === 'pdf') {
        // --- PDF Generation Logic (Single code per page - maybe adapt later?) --- 
        let pdfWidth = customWidth;
        let pdfHeight = customHeight;
        let pdfFormat: string | number[] = paperSize; // Local variable for jsPDF format
        
        if (paperSize !== 'custom') {
          const standardSizes: { [key: string]: [number, number] } = { a4: [210, 297], a5: [148, 210], a3: [297, 420] };
          if (paperSize in standardSizes) {
            pdfWidth = standardSizes[paperSize][0];
            pdfHeight = standardSizes[paperSize][1];
            pdfFormat = paperSize; // Use the string key ('a4', 'a5', 'a3')
          } else {
            console.error("Invalid standard paper size selected, defaulting to A4");
            pdfWidth = 210;
            pdfHeight = 297;
            pdfFormat = 'a4'; // Default format
          }
        } else {
           pdfFormat = [pdfWidth, pdfHeight]; // Use custom dimensions array
        }
        
        const pdf = new jsPDF({
          orientation: orientation,
          unit: 'mm',
          format: pdfFormat // Use the determined format
        });
        
        const codesPerPage = columns * rows;
        const totalPages = Math.ceil(codes.length / codesPerPage);

        const usableWidth = (orientation === 'l' ? pdfHeight : pdfWidth) - marginLeft * 2;
        const usableHeight = (orientation === 'l' ? pdfWidth : pdfHeight) - marginTop * 2;

        const cellWidth = (usableWidth - (columns - 1) * spacing) / columns;
        const cellHeight = (usableHeight - (rows - 1) * spacing) / rows;
        
        // Determine image dimensions (adjust as needed)
        const imageWidthMM = Math.min(cellWidth, 50); // Example max width
        const imageHeightMM = Math.min(cellHeight, 50); // Example max height

        let codeIndex = 0;
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage();
          }
          
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < columns; c++) {
              if (codeIndex >= codes.length) break;
              
              const code = codes[codeIndex];
              
              const xPos = marginLeft + c * (cellWidth + spacing);
              const yPos = marginTop + r * (cellHeight + spacing);
              
              const canvas = document.createElement("canvas");
              try {
                if (format === "qrcode") {
                  await qrcode.toCanvas(canvas, code, { width: 256, margin: 1 });
                } else {
                  // Use convertUnits to get pixel height for JsBarcode
                  JsBarcode(canvas, code, { format: barcodeType, width: 2, height: convertUnits(barcodeHeight, barcodeHeightUnit, 'px'), displayValue: true, lineColor: "#000000", background: "#FFFFFF" });
                }
                const dataUrl = canvas.toDataURL("image/png");
                
                // Add image to PDF - center it within the cell
                const imgX = xPos + (cellWidth - imageWidthMM) / 2;
                const imgY = yPos + (cellHeight - imageHeightMM) / 2;
                pdf.addImage(dataUrl, 'PNG', imgX, imgY, imageWidthMM, imageHeightMM);

                // Optional: Add the code text below the image
                // pdf.setFontSize(8);
                // pdf.text(code, imgX + imageWidthMM / 2, imgY + imageHeightMM + 2, { align: 'center' });

              } catch (imgErr) {
                console.error(`Failed to generate image for code: ${code}`, imgErr);
                // Optionally add placeholder text to PDF
                pdf.setFontSize(8);
                pdf.text(`Error for: ${code}`, xPos, yPos + 5);
              }
              
              codeIndex++;
              
              const totalProgress = (codeIndex / codes.length) * 100;
              setProgress(Math.round(totalProgress));
            }
            if (codeIndex >= codes.length) break;
          }
          // Allow UI update between pages
          await new Promise(resolve => setTimeout(resolve, 0)); 
        }
        
        pdf.save(`${format === "qrcode" ? "qrcodes" : "barcodes"}-layout.pdf`);
      } else { // outputType === 'pdf-tile'
        // --- PDF Tiling Logic --- 
        const margin = 10; // mm - Page margin
        const spacingVal = tileSpacingUnit === 'cm' ? tileSpacing * 10 : tileSpacing; // mm - Space between codes
        const outlineWidth = 0.05; // mm - Thinner border
        const codePadding = 1.5; // mm - Padding inside the border around the code+text
        const initialCodeFontSize = 5; // pt - Starting font size for text
        const minCodeFontSize = 2; // pt - Minimum font size
        const textImageSpacing = 0.5; // mm - Space between image bottom and text top
        const textSideMarginMM = 0.5; // mm - Small margin so text doesn't touch image edges
        const PT_TO_MM = 0.352778; // Conversion factor

        // --- Fixed Tile Width & Calculate Image Area --- 
        const tileWidthMM = 40; 
        const imageMaxWidthMM = tileWidthMM - (codePadding * 2);
        const textMaxWidthMM = imageMaxWidthMM - (textSideMarginMM * 2);
        
        // --- Calculate Code Aspect Ratio & Image Height --- 
        let imageAspectRatio = 1.0; // Default for QR code
        if (format === 'barcode') {
          try { // Quick ratio check for display
            const sampleCanvas = document.createElement('canvas');
            JsBarcode(sampleCanvas, '1234', { format: barcodeType, width: 2, height: 100, displayValue: false }); 
            if (sampleCanvas.width > 0) imageAspectRatio = sampleCanvas.height / sampleCanvas.width;
          } catch (_e) { /* Ignore error for display, rename unused var */ }
        }
        const imageMaxHeightMM = imageMaxWidthMM * imageAspectRatio; // Height constrained by width and ratio

        // --- Fit Text Font Size --- 
        const longestCode = codes.reduce((a, b) => a.length > b.length ? a : b, "");
        let currentFontSize = initialCodeFontSize;
        const tempPdf = new jsPDF(); // Temporary instance for text measurement
        tempPdf.setFontSize(currentFontSize);
        let textWidthMM = tempPdf.getTextWidth(longestCode) * PT_TO_MM;

        while (textWidthMM > textMaxWidthMM && currentFontSize > minCodeFontSize) {
          currentFontSize -= 0.5; // Decrease font size
          tempPdf.setFontSize(currentFontSize);
          textWidthMM = tempPdf.getTextWidth(longestCode) * PT_TO_MM;
        }
        const finalCodeFontSize = Math.max(minCodeFontSize, currentFontSize); // Ensure minimum
        const finalFontHeightMM = finalCodeFontSize * PT_TO_MM * 1.2; // Approximate height based on font size (factor might need tweaking)
        
        // --- Calculate Final Tile Height --- 
        const tileHeightMM = imageMaxHeightMM + textImageSpacing + finalFontHeightMM + (codePadding * 2);
        // --- End Dimension Calculations --- 

        // Calculate exact grid dimensions based on FINAL tile size and spacing
        const gridWidthMM = (tileColumns * tileWidthMM) + (Math.max(0, tileColumns - 1) * spacingVal);
        const gridHeightMM = (tileRows * tileHeightMM) + (Math.max(0, tileRows - 1) * spacingVal);
        
        // Calculate PDF page size needed for one grid + margins
        const pdfPageWidth = gridWidthMM + margin * 2;
        const pdfPageHeight = gridHeightMM + margin * 2;

        console.log(`PDF Tiling: Tile ${tileWidthMM}x${tileHeightMM.toFixed(1)}mm, Img ${imageMaxWidthMM.toFixed(1)}x${imageMaxHeightMM.toFixed(1)}mm (Ratio: ${imageAspectRatio.toFixed(2)}), Font ${finalCodeFontSize.toFixed(1)}pt, Page ${pdfPageWidth.toFixed(1)}x${pdfPageHeight.toFixed(1)}mm`);
        
        const pdf = new jsPDF({ 
          orientation: 'p', 
          unit: 'mm', 
          format: [pdfPageWidth, pdfPageHeight] 
        }); 
        pdf.setFont('helvetica', 'normal'); // Set a standard font
        
        const codesPerPage = tileColumns * tileRows;
        const totalPages = Math.ceil(codes.length / codesPerPage);
        
        let codeIndex = 0;
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage([pdfPageWidth, pdfPageHeight], 'p'); 
            pdf.setFont('helvetica', 'normal'); // Re-apply font settings on new page
          }
          
          for (let r = 0; r < tileRows; r++) {
            for (let c = 0; c < tileColumns; c++) {
              if (codeIndex >= codes.length) break;
              
              const code = codes[codeIndex];
              
              // Calculate top-left corner for the entire tile
              const tileXPos = margin + c * (tileWidthMM + spacingVal);
              const tileYPos = margin + r * (tileHeightMM + spacingVal);
              
              // Calculate position for the image placement inside the padding
              const imageXPos = tileXPos + codePadding;
              const imageYPos = tileYPos + codePadding;
              
              // Use calculated dimensions for placing image 
              const finalImageWidthMM = imageMaxWidthMM;
              const finalImageHeightMM = imageMaxHeightMM;
              
              // Calculate position for the text
              const textXPos = tileXPos + tileWidthMM / 2; // Center text horizontally within the tile
              const textYPos = imageYPos + finalImageHeightMM + textImageSpacing + (finalFontHeightMM * 0.8); // Position baseline correctly
              
              const canvas = document.createElement("canvas");
              try {
                // Generate image data
                let dataUrl: string;
                if (format === "qrcode") {
                  const qrCanvasSize = 256; // Generate at a reasonable fixed size
                  await qrcode.toCanvas(canvas, code, { width: qrCanvasSize, margin: 1 });
                  dataUrl = canvas.toDataURL("image/png");
                  // Add QR code image, scaling it
                  pdf.addImage(dataUrl, 'PNG', imageXPos, imageYPos, finalImageWidthMM, finalImageHeightMM); 
                } else {
                  // Generate barcode with enough pixels for quality, height based on aspect ratio
                  const barcodeCanvasWidthPx = 500; // Generate wider for better quality before scaling
                  const barcodeCanvasHeightPx = barcodeCanvasWidthPx * imageAspectRatio; 
                  JsBarcode(canvas, code, { 
                    format: barcodeType, 
                    width: 2, 
                    height: barcodeCanvasHeightPx, 
                    displayValue: false,
                    margin: 5, // Add some margin in generation for safety
                    lineColor: "#000000", 
                    background: "#FFFFFF" 
                  });
                  dataUrl = canvas.toDataURL("image/png");
                  // Add barcode image, scaling it into the calculated image box
                  pdf.addImage(dataUrl, 'PNG', imageXPos, imageYPos, finalImageWidthMM, finalImageHeightMM);
                }
                
                // Add the code text below the image, centered, using calculated font size
                pdf.setFontSize(finalCodeFontSize);
                pdf.text(code, textXPos, textYPos, { align: 'center', maxWidth: textMaxWidthMM });
                
                // Add outline border around the entire tile if requested
                if (addOutline) {
                   pdf.setLineWidth(outlineWidth);
                   pdf.rect(tileXPos, tileYPos, tileWidthMM, tileHeightMM); 
                }

              } catch (imgErr) {
                 // Handle image generation error (draw border and text)
                 console.error(`Failed to generate image for code: ${code}`, imgErr);
                 pdf.setFontSize(6);
                 // Place error text roughly where code text would be
                 pdf.text(`Error: ${code}`, tileXPos + tileWidthMM / 2, textYPos, { align: 'center'}); 
                 if (addOutline) {
                   pdf.setLineWidth(outlineWidth);
                   pdf.rect(tileXPos, tileYPos, tileWidthMM, tileHeightMM);
                 }
              }
              
              codeIndex++;
              
              const totalProgress = (codeIndex / codes.length) * 100;
              setProgress(Math.round(totalProgress));
            }
            if (codeIndex >= codes.length) break;
          }
          await new Promise(resolve => setTimeout(resolve, 0)); 
        }
        
        pdf.save(`${format === "qrcode" ? "qrcodes" : "barcodes"}-tile-layout.pdf`);
      }

    } catch (error) {
      console.error("Error generating bulk codes:", error);
      alert("An error occurred while generating codes. Please check your input or layout settings.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Effect to regenerate preview images when settings change
  useEffect(() => {
    const generatePreviewImages = async () => {
      const numPreviewCodes = Math.min(count, tileColumns * tileRows);
      if (numPreviewCodes <= 0) {
        setPreviewCodeImages([]);
        return;
      }

      const codesToPreview = generateSequence().slice(0, numPreviewCodes);
      const imageDataUrls: (string | null)[] = [];

      for (const code of codesToPreview) {
        const canvas = document.createElement("canvas");
        try {
          if (format === "qrcode") {
            // Use a smaller fixed size for QR preview for performance
            await qrcode.toCanvas(canvas, code, { width: 64, margin: 1 });
          } else {
            // Use smaller fixed dimensions for barcode preview
            JsBarcode(canvas, code, { 
              format: barcodeType, 
              width: 1, // Smaller width for preview
              height: 30, // Smaller fixed height for preview
              displayValue: false, // Don't show text in preview image
              margin: 2
            });
          }
          imageDataUrls.push(canvas.toDataURL("image/png"));
        } catch (error) {
          console.error("Error generating preview code:", error);
          imageDataUrls.push(null); // Indicate error for this code
        }
      }
      setPreviewCodeImages(imageDataUrls);
    };

    // Only run if pdf-tile output is selected
    if (outputType === 'pdf-tile') {
      generatePreviewImages();
    }

  }, [ prefix, suffix, startNumber, increment, padding, count, format, barcodeType, tileColumns, tileRows, outputType, generateSequence /* Add generateSequence dependency */ ]);

  // Effect to calculate and display estimated grid size for tiling
  useEffect(() => {
    if (outputType === 'pdf-tile') {
      const spacingVal = tileSpacingUnit === 'cm' ? tileSpacing * 10 : tileSpacing;
      // Use fixed tile width for grid calculation
      const fixedTileWidthMM = 40;
      const width = (tileColumns * fixedTileWidthMM) + (Math.max(0, tileColumns - 1) * spacingVal);
      
      // Recalculate tile height here for display based on current settings
      const codePadding = 1.5; 
      const textHeightApproximation = 1.5; // Use approximation for display
      const textImageSpacing = 0.5;
      const imageMaxWidthMM = fixedTileWidthMM - (codePadding * 2);
      let imageAspectRatio = 1.0;
      if (format === 'barcode') { 
         try { // Quick ratio check for display
            const sampleCanvas = document.createElement('canvas');
            JsBarcode(sampleCanvas, '1234', { format: barcodeType, width: 2, height: 100, displayValue: false }); 
            if (sampleCanvas.width > 0) imageAspectRatio = sampleCanvas.height / sampleCanvas.width;
          } catch (e) { /* Ignore error for display */ }
      }
      const imageMaxHeightMM = imageMaxWidthMM * imageAspectRatio;
      const calculatedTileHeightMM = imageMaxHeightMM + textImageSpacing + textHeightApproximation + (codePadding * 2); 
      
      const height = (tileRows * calculatedTileHeightMM) + (Math.max(0, tileRows - 1) * spacingVal);
      
      setDisplayGridWidth(width.toFixed(1));
      setDisplayGridHeight(height.toFixed(1));
    } else {
      setDisplayGridWidth("0");
      setDisplayGridHeight("0");
    }
    // Dependencies for grid display calculation
  }, [outputType, tileColumns, tileRows, tileSpacing, tileSpacingUnit, format, barcodeType]); 

  // Effect to calculate preview container dimensions - NOT needed for pdf-tile anymore
  // useEffect(() => { ... }, [paperSize, orientation, customWidth, customHeight]); 
  // We can use a fixed reasonable size for the preview container in pdf-tile mode

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

            {/* Barcode Height - Hidden for pdf-tile output */}
            {format === "barcode" && outputType !== 'pdf-tile' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="barcode-height">
                  Barcode Height
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  id="barcode-height"
                  type="number"
                  min="10"
                  value={barcodeHeight}
                  onChange={(e) => setBarcodeHeight(Number(e.target.value))}
                  disabled={isGenerating}
                />
              </div>
            )}

            {/* Barcode Height Unit - Hidden for pdf-tile output */}
            {format === "barcode" && outputType !== 'pdf-tile' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="barcode-height-unit">
                  Barcode Height Unit
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  id="barcode-height-unit"
                  value={barcodeHeightUnit}
                  onChange={(e) => handleUnitChange(e.target.value as 'px' | 'cm' | 'mm')}
                  disabled={isGenerating}
                >
                  <option value="px">Pixels (px)</option>
                  <option value="cm">Centimeters (cm)</option>
                  <option value="mm">Millimeters (mm)</option>
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
            
            {/* Suffix Input */}
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
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="output-type">
                Output Type
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio" className="form-radio" name="output-type" value="zip"
                    checked={outputType === 'zip'} onChange={() => setOutputType('zip')} disabled={isGenerating}
                  />
                  <span className="ml-2">ZIP (Individual Images)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio" className="form-radio" name="output-type" value="pdf"
                    checked={outputType === 'pdf'} onChange={() => setOutputType('pdf')} disabled={isGenerating}
                  />
                  <span className="ml-2">PDF (Layout Sheet)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio" className="form-radio" name="output-type" value="pdf-tile"
                    checked={outputType === 'pdf-tile'} onChange={() => setOutputType('pdf-tile')} disabled={isGenerating}
                  />
                  <span className="ml-2">PDF (Tile Sheet)</span>
                </label>
              </div>
            </div>
            
            {/* PDF Layout Options - Conditionally render if outputType is pdf */}
            {outputType === 'pdf' && (
              <div className="space-y-4 p-4 border border-zinc-300 rounded-lg bg-zinc-100">
                 <h3 className="text-lg font-medium text-gray-800 mb-3">PDF Layout Options</h3>
                 
                 {/* Paper Size */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="paper-size">
                      Paper Size
                    </label>
                    <select id="paper-size" value={paperSize} onChange={e => setPaperSize(e.target.value)} disabled={isGenerating} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="a4">A4 (210x297mm)</option>
                      <option value="a5">A5 (148x210mm)</option>
                      <option value="a3">A3 (297x420mm)</option>
                      <option value="custom">Custom Size</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="orientation">
                      Orientation
                    </label>
                    <select id="orientation" value={orientation} onChange={e => setOrientation(e.target.value as 'p' | 'l')} disabled={isGenerating} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="p">Portrait</option>
                      <option value="l">Landscape</option>
                    </select>
                  </div>
                 </div>
                 
                 {/* Custom Dimensions (if paperSize is custom) */} 
                 {paperSize === 'custom' && (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="custom-width">Width (mm)</label>
                       <input id="custom-width" type="number" min="10" value={customWidth} onChange={e => setCustomWidth(Number(e.target.value))} disabled={isGenerating} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                     </div>
                     <div>
                       <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="custom-height">Height (mm)</label>
                       <input id="custom-height" type="number" min="10" value={customHeight} onChange={e => setCustomHeight(Number(e.target.value))} disabled={isGenerating} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                     </div>
                   </div>
                 )}
                 
                 {/* Columns and Rows */} 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="columns">Columns</label>
                     <input id="columns" type="number" min="1" value={columns} onChange={e => setColumns(Number(e.target.value))} disabled={isGenerating} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                   </div>
                   <div>
                     <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="rows">Rows per Page</label>
                     <input id="rows" type="number" min="1" value={rows} onChange={e => setRows(Number(e.target.value))} disabled={isGenerating} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                   </div>
                 </div>
                 
                 {/* Margins and Spacing */} 
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div>
                     <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="margin-top">Top Margin (mm)</label>
                     <input id="margin-top" type="number" min="0" value={marginTop} onChange={e => setMarginTop(Number(e.target.value))} disabled={isGenerating} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                   </div>
                   <div>
                     <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="margin-left">Left Margin (mm)</label>
                     <input id="margin-left" type="number" min="0" value={marginLeft} onChange={e => setMarginLeft(Number(e.target.value))} disabled={isGenerating} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                   </div>
                   <div>
                     <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="spacing">Spacing (mm)</label>
                     <input id="spacing" type="number" min="0" value={spacing} onChange={e => setSpacing(Number(e.target.value))} disabled={isGenerating} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                   </div>
                 </div>
              </div>
            )}

            {/* PDF Tiling Options */}
            {outputType === 'pdf-tile' && (
              <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                <h4 className="text-lg font-medium mb-4 text-gray-800">PDF Tiling Options (Fixed Tile Size: 40x15mm)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Columns Input */}
                  <div>
                    <label htmlFor="tile-columns" className="block text-sm font-medium text-gray-700">Columns (Horizontal)</label>
                    {/* Input for tileColumns */}
                     <input
                      id="tile-columns"
                      type="number"
                      min="1"
                      value={tileColumns}
                      onChange={(e) => setTileColumns(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      disabled={isGenerating}
                    />
                  </div>
                  {/* Rows Input */}
                  <div>
                    <label htmlFor="tile-rows" className="block text-sm font-medium text-gray-700">Rows (Vertical)</label>
                    {/* Input for tileRows */}
                    <input
                      id="tile-rows"
                      type="number"
                      min="1"
                      value={tileRows}
                      onChange={(e) => setTileRows(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      disabled={isGenerating}
                    />
                  </div>
                   {/* Tile Width Input - REMOVED for pdf-tile */}
                  {/* <div> ... </div> */}
                   
                  {/* Spacing Input */}
                  <div>
                    <label htmlFor="tile-spacing" className="block text-sm font-medium text-gray-700">Spacing</label>
                    {/* Spacing Input and Unit Select */}
                     <div className="flex items-center space-x-2 mt-1">
                       <input
                        id="tile-spacing"
                        type="number"
                        min="0"
                        value={tileSpacing}
                        onChange={(e) => setTileSpacing(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        disabled={isGenerating}
                      />
                      <select
                        value={tileSpacingUnit}
                        onChange={(e) => setTileSpacingUnit(e.target.value as 'mm' | 'cm')}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        disabled={isGenerating}
                      >
                        <option value="mm">mm</option>
                        <option value="cm">cm</option>
                      </select>
                    </div>
                  </div>
                  {/* Add Outline Checkbox */}
                   <div className="md:col-span-2 flex items-center">
                     {/* Checkbox for addOutline */}
                      <input
                       id="add-outline"
                       type="checkbox"
                       checked={addOutline}
                       onChange={(e) => setAddOutline(e.target.checked)}
                       className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mr-2"
                       disabled={isGenerating}
                     />
                     <label htmlFor="add-outline" className="text-sm font-medium text-gray-700">Add Border Outline to Each Code</label>
                   </div>
                </div>
                
                 {/* Estimated Grid Size Display */}
                 <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-200">
                   Calculated Page Grid Size (excl. 10mm margins): {displayGridWidth}mm W x {displayGridHeight}mm H
                 </div>

                {/* ------ Preview Section ------ */}
                <div className="mt-6 border-t pt-4">
                   <h5 className="text-md font-medium mb-3 text-gray-700">Layout Preview (Single Page)</h5>
                   <div
                     className="mx-auto border border-dashed border-gray-400 bg-white p-1 overflow-hidden relative"
                     style={{
                       // Use fixed reasonable size for tile preview container
                       width: `210px`, 
                       height: `297px`, 
                     }}
                   >
                     {/* Grid overlay - use absolute positioning to fill the container */}
                     <div
                       className="absolute inset-0 grid"
                       style={{
                         gridTemplateColumns: `repeat(${tileColumns}, minmax(0, 1fr))`,
                         gridTemplateRows: `repeat(${tileRows}, minmax(0, 1fr))`,
                         gap: '1px', // Smaller gap for preview
                       }}
                     >
                       {/* Generate cells with actual code previews */}
                        {Array.from({ length: tileColumns * tileRows }).map((_, index) => {
                         const imageUrl = previewCodeImages[index];
                         const showCode = index < count; // Only show if index is within requested count

                         return (
                           <div
                             key={index}
                             className="border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden p-0.5"
                           >
                             {showCode ? (
                               imageUrl ? (
                                 // eslint-disable-next-line @next/next/no-img-element
                                 <img 
                                   src={imageUrl} 
                                   alt={`Code Preview ${index + 1}`}
                                   className="max-w-full max-h-full object-contain"
                                 />
                               ) : (
                                 // Placeholder for error or loading state
                                 <span className="text-red-500 text-xs">Error</span>
                               )
                             ) : (
                               // Placeholder for cells beyond the count
                               <div className="w-full h-full bg-gray-200"></div>
                             )}
                           </div>
                         );
                       })}
                     </div>
                   </div>
                   <p className="text-center text-sm text-gray-600 mt-2">
                     Codes per page: <span className="font-semibold">{tileColumns * tileRows}</span>
                   </p>
                 </div>
                {/* ------ End Preview Section ------ */}

              </div>
            )}

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
                    Configure your settings and click &quot;Generate Bulk Codes&quot; to start.
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