"use client";

import React, { useState, useRef, useEffect } from "react";
import QRCode from "react-qr-code";
import * as qrcode from "qrcode";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ImageFormat = 'png' | 'svg' | 'jpg' | 'eps' | 'pdf';

interface QRCodeGeneratorProps {
  onDownload?: (dataUrl: string) => void;
}

type QRCodeType = 'url' | 'text' | 'email' | 'phone' | 'sms' | 'contact' | 'wifi';

interface FormField {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  required?: boolean;
}

export default function QRCodeGenerator({ onDownload }: QRCodeGeneratorProps) {
  const [qrType, setQRType] = useState<QRCodeType>('url');
  const [formValues, setFormValues] = useState<Record<string, string>>({
    url: '',
    text: '',
    email: '',
    emailSubject: '',
    emailBody: '',
    phone: '',
    sms: '',
    smsBody: '',
    firstName: '',
    lastName: '',
    organization: '',
    contactEmail: '',
    contactPhone: '',
    wifiSsid: '',
    wifiPassword: '',
    wifiEncryption: 'WPA'
  });
  const [foregroundColor, setForegroundColor] = useState<string>("#000000");
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
  const [size, setSize] = useState<number>(256);
  const [qrValue, setQrValue] = useState<string>("");
  const [imageFormat, setImageFormat] = useState<ImageFormat>('png');
  const qrRef = useRef<HTMLDivElement>(null);

  const qrTypes = [
    { value: 'url', label: 'URL' },
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'sms', label: 'SMS' },
    { value: 'contact', label: 'Contact Information' },
    { value: 'wifi', label: 'WiFi Network' }
  ];

  const imageFormats = [
    { value: 'png', label: 'PNG' },
    { value: 'svg', label: 'SVG' },
    { value: 'jpg', label: 'JPG' },
    { value: 'eps', label: 'EPS' },
    { value: 'pdf', label: 'PDF' },
  ];

  const formFields: Record<QRCodeType, FormField[]> = {
    url: [
      { id: 'url', label: 'Website URL', type: 'url', placeholder: 'https://example.com', required: true }
    ],
    text: [
      { id: 'text', label: 'Text Content', type: 'textarea', placeholder: 'Enter your text here...', required: true }
    ],
    email: [
      { id: 'email', label: 'Email Address', type: 'email', placeholder: 'recipient@example.com', required: true },
      { id: 'emailSubject', label: 'Subject', type: 'text', placeholder: 'Email subject (optional)' },
      { id: 'emailBody', label: 'Message', type: 'textarea', placeholder: 'Email body (optional)' }
    ],
    phone: [
      { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1234567890', required: true }
    ],
    sms: [
      { id: 'sms', label: 'Phone Number', type: 'tel', placeholder: '+1234567890', required: true },
      { id: 'smsBody', label: 'Message', type: 'textarea', placeholder: 'SMS message (optional)' }
    ],
    contact: [
      { id: 'firstName', label: 'First Name', type: 'text', placeholder: 'John', required: true },
      { id: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Doe' },
      { id: 'organization', label: 'Organization', type: 'text', placeholder: 'Company name (optional)' },
      { id: 'contactEmail', label: 'Email', type: 'email', placeholder: 'john.doe@example.com' },
      { id: 'contactPhone', label: 'Phone', type: 'tel', placeholder: '+1234567890' }
    ],
    wifi: [
      { id: 'wifiSsid', label: 'Network Name (SSID)', type: 'text', placeholder: 'WiFi Network Name', required: true },
      { id: 'wifiPassword', label: 'Password', type: 'text', placeholder: 'Network password' },
      { id: 'wifiEncryption', label: 'Encryption', type: 'select', placeholder: 'WPA/WPA2' }
    ]
  };

  const wifiEncryptionOptions = [
    { value: 'WPA', label: 'WPA/WPA2' },
    { value: 'WEP', label: 'WEP' },
    { value: 'nopass', label: 'No Password' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // Generate QR code value based on type and form values
  useEffect(() => {
    let value = '';
    
    switch (qrType) {
      case 'url':
        value = formValues.url;
        break;
      case 'text':
        value = formValues.text;
        break;
      case 'email':
        value = `mailto:${formValues.email}`;
        if (formValues.emailSubject) value += `?subject=${encodeURIComponent(formValues.emailSubject)}`;
        if (formValues.emailBody) value += `${formValues.emailSubject ? '&' : '?'}body=${encodeURIComponent(formValues.emailBody)}`;
        break;
      case 'phone':
        value = `tel:${formValues.phone}`;
        break;
      case 'sms':
        value = `sms:${formValues.sms}`;
        if (formValues.smsBody) value += `?body=${encodeURIComponent(formValues.smsBody)}`;
        break;
      case 'contact':
        // vCard format
        value = `BEGIN:VCARD\nVERSION:3.0\n`;
        value += `N:${formValues.lastName};${formValues.firstName}\n`;
        value += `FN:${formValues.firstName} ${formValues.lastName}\n`;
        if (formValues.organization) value += `ORG:${formValues.organization}\n`;
        if (formValues.contactEmail) value += `EMAIL:${formValues.contactEmail}\n`;
        if (formValues.contactPhone) value += `TEL:${formValues.contactPhone}\n`;
        value += `END:VCARD`;
        break;
      case 'wifi':
        value = `WIFI:S:${formValues.wifiSsid};`;
        if (formValues.wifiEncryption !== 'nopass') {
          value += `T:${formValues.wifiEncryption};`;
          if (formValues.wifiPassword) value += `P:${formValues.wifiPassword};`;
        } else {
          value += `T:;`;
        }
        value += `;`;
        break;
    }
    
    setQrValue(value);
  }, [qrType, formValues]);

  const generateQRCode = async () => {
    if (qrValue.trim() === "") return;
    
    try {
      if (imageFormat === 'svg') {
        // For SVG format, we'll use the actual QR code SVG
        const qrElement = qrRef.current?.querySelector('svg');
        if (!qrElement) return;
        
        // Clone the SVG to modify it
        const svgElement = qrElement.cloneNode(true) as SVGElement;
        
        // Set the background color
        svgElement.setAttribute('style', `background-color: ${backgroundColor};`);
        
        // Convert to string
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        // Download
        const link = document.createElement("a");
        link.href = url;
        link.download = `qrcode-${qrType}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Generate QR code as canvas
        const canvas = document.createElement("canvas");
        await qrcode.toCanvas(canvas, qrValue, {
          width: size,
          margin: 1,
          color: {
            dark: foregroundColor,
            light: backgroundColor,
          },
        });
        
        // Get appropriate mime type and extension
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
        
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL(mimeType);
        
        if (onDownload) {
          onDownload(dataUrl);
        } else {
          // Default download behavior
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = `qrcode-${qrType}.${fileExtension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (err) {
      console.error("Error generating QR code", err);
    }
  };

  const downloadQRCode = async () => {
    if (!qrRef.current || qrValue === "") return;

    const svgElement = qrRef.current.querySelector("svg");
    if (!svgElement) return;

    // Create a temporary canvas to draw the SVG with background color
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = size;
    canvas.height = size;

    if (!ctx) return;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the SVG onto the canvas
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = async () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      let mimeType = 'image/png';
      let fileExtension = 'png';

      try {
        if (imageFormat === 'svg') {
          // Download SVG directly (background color won't be included easily)
          const link = document.createElement("a");
          link.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
          link.download = `qrcode-${Date.now()}.svg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else if (imageFormat === 'pdf') {
          // --- PDF Download Logic --- 
          const pdf = new jsPDF({
            orientation: 'p', // Portrait
            unit: 'mm',
            format: 'a4' // Default to A4 for single code
          });
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const margin = 10; // 10mm margin
          const imgData = canvas.toDataURL('image/png');
          
          // Calculate image dimensions (fit within margins)
          const availableWidth = pdfWidth - margin * 2;
          const availableHeight = pdfHeight - margin * 2;
          let imgWidth = canvas.width * 0.264583; // Convert px to mm (approx)
          let imgHeight = canvas.height * 0.264583;
          const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
          imgWidth *= ratio;
          imgHeight *= ratio;
          
          // Center image
          const xPos = (pdfWidth - imgWidth) / 2;
          const yPos = (pdfHeight - imgHeight) / 2;
          
          pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
          pdf.save(`qrcode-${Date.now()}.pdf`);

        } else {
          // PNG, JPG
          if (imageFormat === 'jpg') {
            mimeType = 'image/jpeg';
            fileExtension = 'jpg';
          }
          const dataUrl = canvas.toDataURL(mimeType);
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = `qrcode-${Date.now()}.${fileExtension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (err) {
        console.error("Error downloading QR code", err);
        alert("Failed to download QR code.")
      }
    };
    img.onerror = (err) => {
      console.error("Error loading SVG image for canvas drawing", err);
      URL.revokeObjectURL(url);
      alert("Failed to prepare QR code for download.")
    };
    img.src = url;
  };

  // Check if the form has required values filled
  const isFormValid = () => {
    const activeFields = formFields[qrType];
    for (const field of activeFields) {
      if (field.required && !formValues[field.id]) {
        return false;
      }
    }
    return true;
  };

  return (
    <div className="w-full mx-auto bg-white rounded-lg shadow-lg p-6 border border-zinc-200">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">QR Code Generator</h2>
        <p className="text-gray-600">Create custom QR codes for various types of data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="qr-type">
              QR Code Type
            </label>
            <select
              id="qr-type"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={qrType}
              onChange={(e) => setQRType(e.target.value as QRCodeType)}
            >
              {qrTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic form fields based on QR type */}
          {formFields[qrType].map((field) => (
            <div key={field.id} className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={field.id}>
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              
              {field.type === 'textarea' ? (
                <textarea
                  id={field.id}
                  name={field.id}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={field.placeholder}
                  value={formValues[field.id]}
                  onChange={handleInputChange}
                  rows={4}
                  required={field.required}
                />
              ) : field.type === 'select' ? (
                <select
                  id={field.id}
                  name={field.id}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formValues[field.id]}
                  onChange={handleInputChange}
                  required={field.required}
                >
                  {field.id === 'wifiEncryption' && wifiEncryptionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={field.id}
                  name={field.id}
                  type={field.type}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={field.placeholder}
                  value={formValues[field.id]}
                  onChange={handleInputChange}
                  required={field.required}
                />
              )}
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fgColor">
                Foreground Color
              </label>
              <input
                className="w-full"
                id="fgColor"
                type="color"
                value={foregroundColor}
                onChange={(e) => setForegroundColor(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bgColor">
                Background Color
              </label>
              <input
                className="w-full"
                id="bgColor"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="size">
              Size: {size}px
            </label>
            <input
              className="w-full"
              id="size"
              type="range"
              min="128"
              max="512"
              step="8"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
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
              {imageFormats.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>
          
          <button
            className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={generateQRCode}
            disabled={!isFormValid() || !qrValue}
          >
            Download QR Code
          </button>
        </div>
        
        {/* Right Column - Preview */}
        <div className="flex flex-col items-center justify-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">QR Code Preview</h3>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex items-center justify-center w-full h-full" ref={qrRef}>
            {qrValue ? (
              <div className="p-4 bg-white rounded-md shadow-sm inline-block">
                <QRCode
                  value={qrValue}
                  size={size}
                  fgColor={foregroundColor}
                  bgColor={backgroundColor}
                  level="M"
                />
              </div>
            ) : (
              <div className="text-gray-400 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                </svg>
                <p>Fill the form to generate a QR code</p>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            {qrValue && `Type: ${qrTypes.find(t => t.value === qrType)?.label}`}
          </p>
        </div>
      </div>
    </div>
  );
} 