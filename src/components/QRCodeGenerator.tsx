"use client";

import React, { useState, useRef, useEffect } from "react";
import QRCode from "react-qr-code";
import * as qrcode from "qrcode";

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
    <div className="w-full bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
      {/* Optional Header */}
      {/* <div className="p-6 border-b border-neutral-200">
        <h2 className="text-xl font-semibold text-neutral-800">QR Code Generator</h2>
        <p className="text-sm text-neutral-500 mt-1">Create custom QR codes for various data types.</p>
      </div> */}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Left Column - Form (with scrollbar) */}
        <div className="lg:col-span-2 p-6 space-y-6 lg:overflow-y-auto lg:max-h-[calc(100vh-200px)]">
          <div className="rounded-lg border border-neutral-200 p-4 bg-neutral-50">
            <label className="block text-neutral-700 text-sm font-semibold mb-2" htmlFor="qr-type">
              Type of Content
            </label>
            <select
              id="qr-type"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm bg-white"
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

          {/* Dynamic form fields */}
          <div className="space-y-4">
            {formFields[qrType].map((field) => (
              <div key={field.id}>
                <label className="block text-neutral-700 text-sm font-semibold mb-1.5" htmlFor={field.id}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {field.type === 'textarea' ? (
                  <textarea
                    id={field.id}
                    name={field.id}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm resize-vertical min-h-[80px]"
                    placeholder={field.placeholder}
                    value={formValues[field.id]}
                    onChange={handleInputChange}
                    rows={3} // Adjusted default rows
                    required={field.required}
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={field.id}
                    name={field.id}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm bg-white"
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
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                    placeholder={field.placeholder}
                    value={formValues[field.id]}
                    onChange={handleInputChange}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Customization Options */}
          <div className="space-y-4 pt-4 border-t border-neutral-200">
            <h3 className="text-lg font-medium text-neutral-900">Customization</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-700 text-sm font-semibold mb-1.5" htmlFor="fgColor">
                  Code Color
                </label>
                <input
                  className="w-full h-10 p-1 border border-neutral-300 rounded-md cursor-pointer"
                  id="fgColor"
                  type="color"
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-neutral-700 text-sm font-semibold mb-1.5" htmlFor="bgColor">
                  Background Color
                </label>
                <input
                  className="w-full h-10 p-1 border border-neutral-300 rounded-md cursor-pointer"
                  id="bgColor"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-700 text-sm font-semibold mb-1.5" htmlFor="size">
                Size <span className="text-xs text-neutral-500">({size}px)</span>
              </label>
              <input
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer range-lg dark:bg-neutral-700 accent-indigo-600"
                id="size"
                type="range"
                min="64"
                max="1024"
                step="16"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </div>
          </div>
          
          {/* Download Section */}
          <div className="space-y-4 pt-4 border-t border-neutral-200">
             <h3 className="text-lg font-medium text-neutral-900">Download</h3>
            <div>
              <label className="block text-neutral-700 text-sm font-semibold mb-1.5" htmlFor="image-format">
                Format
              </label>
              <select
                id="image-format"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm bg-white"
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
              onClick={generateQRCode}
              disabled={!isFormValid() || !qrValue}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download QR Code
            </button>
          </div>
        </div>
        
        {/* Right Column - Preview (Sticky and Centered) */}
        <div className="lg:col-span-1 bg-neutral-100 p-6 flex flex-col items-center justify-center lg:sticky lg:top-[calc(64px+1rem)] lg:h-[calc(100vh-128px-2rem)]">
          <h3 className="text-base font-semibold text-neutral-700 mb-4">Preview</h3>
          <div className="bg-white p-4 rounded-lg shadow-md border border-neutral-200 flex items-center justify-center w-full aspect-square max-w-[300px]" ref={qrRef}>
            {qrValue ? (
              <div className="transition-all duration-300 ease-in-out" style={{ width: `${Math.min(size, 250)}px`, height: `${Math.min(size, 250)}px` }}>
                <QRCode
                  value={qrValue}
                  size={Math.min(size, 250)} // Limit preview size slightly
                  fgColor={foregroundColor}
                  bgColor={backgroundColor}
                  level="M" // Consider adding Quality level option
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
            ) : (
              <div className="text-neutral-400 text-center p-8">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-3 text-neutral-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z" />
                </svg>
                <p className="text-sm font-medium">Enter content to generate QR code</p>
              </div>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-3 h-4">
            {qrValue && `Type: ${qrTypes.find(t => t.value === qrType)?.label}`}
          </p>
        </div>
      </div>
    </div>
  );
} 