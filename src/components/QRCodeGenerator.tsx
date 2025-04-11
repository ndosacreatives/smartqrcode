"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import * as qrcode from "qrcode";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSubscription } from "@/context/SubscriptionContext";

type QRCodeType = 'url' | 'text' | 'email' | 'phone' | 'sms' | 'contact' | 'wifi';

type ImageFormat = 'png' | 'svg' | 'jpg' | 'jpeg' | 'pdf';

interface QRCodeGeneratorProps {
  onDownload?: (dataUrl: string) => void;
}

interface FormField {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
}

// Add QR code template definitions
const qrTemplates = [
  { id: "basic", name: "Basic", free: true },
  { id: "rounded", name: "Rounded Corners", free: true },
  { id: "gradient", name: "Gradient", free: false },
  { id: "dotted", name: "Dotted", free: false },
  { id: "framed", name: "Framed", free: false },
  { id: "logo-overlay", name: "Logo Overlay", free: false },
];

export default function QRCodeGenerator({ onDownload }: QRCodeGeneratorProps) {
  // Use the subscription context
  const { 
    hasFeature, 
    remainingDaily, 
    decrementDaily, 
    showWatermark,
    bulkGenerationLimit,
    subscriptionTier
  } = useSubscription();
  
  const router = useRouter();
  const [qrType, setQRType] = useState<QRCodeType>('url');
  const [formValues, setFormValues] = useState<Record<string, string>>({
    url: '',
    text: '',
    email: '',
    emailSubject: '',
    emailBody: '',
    phone: '',
    smsPhone: '',
    smsMessage: '',
    contactName: '',
    contactOrg: '',
    contactPhone: '',
    contactEmail: '',
    contactAddress: '',
    contactUrl: '',
    wifiSsid: '',
    wifiPassword: '',
    wifiType: 'WPA',
    wifiHidden: 'false',
  });

  const [qrValue, setQrValue] = useState<string>('');
  const [size, setSize] = useState<number>(200);
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF');
  const [foregroundColor, setForegroundColor] = useState<string>('#000000');
  const [imageFormat, setImageFormat] = useState<ImageFormat>('png');
  const qrRef = useRef<HTMLDivElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("basic");

  const qrTypes = [
    { value: 'url', label: 'Website URL' },
    { value: 'text', label: 'Plain Text' },
    { value: 'email', label: 'Email Address' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'sms', label: 'SMS Message' },
    { value: 'contact', label: 'Contact Information' },
    { value: 'wifi', label: 'WiFi Network' },
  ] as const;

  const formFields: Record<QRCodeType, FormField[]> = {
    url: [
      { id: 'url', label: 'Website URL', type: 'url', placeholder: 'https://example.com', required: true },
    ],
    text: [
      { id: 'text', label: 'Your Text', type: 'textarea', placeholder: 'Enter text to encode in QR code', required: true },
    ],
    email: [
      { id: 'email', label: 'Email Address', type: 'email', placeholder: 'email@example.com', required: true },
      { id: 'emailSubject', label: 'Subject (Optional)', type: 'text', placeholder: 'Email subject' },
      { id: 'emailBody', label: 'Body (Optional)', type: 'textarea', placeholder: 'Email body text' },
    ],
    phone: [
      { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1234567890', required: true },
    ],
    sms: [
      { id: 'smsPhone', label: 'Phone Number', type: 'tel', placeholder: '+1234567890', required: true },
      { id: 'smsMessage', label: 'Message (Optional)', type: 'textarea', placeholder: 'Your SMS message' },
    ],
    contact: [
      { id: 'contactName', label: 'Name', type: 'text', placeholder: 'John Doe', required: true },
      { id: 'contactOrg', label: 'Organization (Optional)', type: 'text', placeholder: 'Company Name' },
      { id: 'contactPhone', label: 'Phone (Optional)', type: 'tel', placeholder: '+1234567890' },
      { id: 'contactEmail', label: 'Email (Optional)', type: 'email', placeholder: 'email@example.com' },
      { id: 'contactAddress', label: 'Address (Optional)', type: 'textarea', placeholder: '123 Main St, City, Country' },
      { id: 'contactUrl', label: 'Website (Optional)', type: 'url', placeholder: 'https://example.com' },
    ],
    wifi: [
      { id: 'wifiSsid', label: 'Network Name (SSID)', type: 'text', placeholder: 'WiFi Network Name', required: true },
      { id: 'wifiPassword', label: 'Password', type: 'password', placeholder: 'WiFi Password' },
      { id: 'wifiType', label: 'Security Type', type: 'select', placeholder: 'Select security type', required: true,
        options: [
          { value: 'WPA', label: 'WPA/WPA2/WPA3' },
          { value: 'WEP', label: 'WEP' },
          { value: 'nopass', label: 'No Password' },
        ],
      },
      { id: 'wifiHidden', label: 'Hidden Network', type: 'select', placeholder: 'Is this network hidden?',
        options: [
          { value: 'false', label: 'No' },
          { value: 'true', label: 'Yes' },
        ],
      },
    ],
  };

  const imageFormats = [
    { value: "png", label: "PNG" },
    { value: "jpeg", label: "JPEG" },
    { value: "svg", label: "SVG", premium: true },
    { value: "pdf", label: "PDF", premium: true },
  ];

  useEffect(() => {
    updateQRValue();
  }, [qrType, formValues]);

  const updateQRValue = () => {
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
        value = `sms:${formValues.smsPhone}`;
        if (formValues.smsMessage) value += `?body=${encodeURIComponent(formValues.smsMessage)}`;
        break;
      case 'contact':
        // Simple vCard format
        value = 'BEGIN:VCARD\nVERSION:3.0\n';
        value += formValues.contactName ? `FN:${formValues.contactName}\n` : '';
        value += formValues.contactOrg ? `ORG:${formValues.contactOrg}\n` : '';
        value += formValues.contactPhone ? `TEL:${formValues.contactPhone}\n` : '';
        value += formValues.contactEmail ? `EMAIL:${formValues.contactEmail}\n` : '';
        value += formValues.contactAddress ? `ADR:;;${formValues.contactAddress};;;\n` : '';
        value += formValues.contactUrl ? `URL:${formValues.contactUrl}\n` : '';
        value += 'END:VCARD';
        break;
      case 'wifi':
        value = `WIFI:T:${formValues.wifiType};S:${formValues.wifiSsid};`;
        if (formValues.wifiPassword && formValues.wifiType !== 'nopass') {
          value += `P:${formValues.wifiPassword};`;
        }
        value += `H:${formValues.wifiHidden};`;
        break;
    }

    setQrValue(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormValues(prev => ({ ...prev, [id]: value }));
  };

  const isFormValid = () => {
    const requiredFields = formFields[qrType].filter(field => field.required);
    return requiredFields.every(field => formValues[field.id].trim() !== '');
  };

  const downloadQRCode = async () => {
    try {
      // Only decrement for free tier
      if (!hasFeature("noWatermark")) {
        decrementDaily();
      }
      
      if (qrValue.trim() === "") return;
      
      if (imageFormat === 'svg') {
        // For SVG format, we'll use the actual QR code SVG
        if (qrRef.current) {
          const svgElement = qrRef.current.querySelector('svg');
          if (svgElement) {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = svgUrl;
            downloadLink.download = `qrcode-${qrType}.svg`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(svgUrl);
          }
        }
      } else {
        // For other formats, use the qrcode.toDataURL method
        const options: qrcode.QRCodeToDataURLOptions = {
          margin: 1,
          width: size,
          color: {
            dark: foregroundColor,
            light: backgroundColor
          }
        };
        
        const dataUrl = await qrcode.toDataURL(qrValue, options);
        
        let fileExtension = imageFormat;
        if (fileExtension === 'jpg') fileExtension = 'jpeg';
        
        if (onDownload) {
          onDownload(dataUrl);
        } else {
          // Default download behavior
          const downloadLink = document.createElement('a');
          downloadLink.href = dataUrl;
          downloadLink.download = `qrcode-${qrType}.${fileExtension}`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      }
    } catch (error) {
      console.error("Error downloading QR code:", error);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Form Column - Left Side */}
      <div className="flex-1">
        {/* Optional Header */}
        {/* <div className="p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800">QR Code Generator</h2>
          <p className="text-neutral-500 text-sm mt-1">Create custom QR codes for various purposes</p>
        </div> */}
        
        <div className="rounded-lg border border-neutral-200 p-4 bg-neutral-50">
          <label className="block text-neutral-700 text-sm font-semibold mb-2" htmlFor="qr-type">
            QR Code Type
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
          
          <div className="mt-4 space-y-4">
            {formFields[qrType].map((field) => (
              <div key={field.id}>
                <label className="block text-neutral-700 text-sm font-semibold mb-2" htmlFor={field.id}>
                  {field.label}
                </label>
                
                {field.type === 'textarea' ? (
                  <textarea
                    id={field.id}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm resize-none"
                    placeholder={field.placeholder}
                    rows={4}
                    value={formValues[field.id] || ''}
                    onChange={handleInputChange}
                    required={field.required}
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={field.id}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm bg-white"
                    value={formValues[field.id] || ''}
                    onChange={handleInputChange}
                    required={field.required}
                  >
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.id}
                    type={field.type}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                    placeholder={field.placeholder}
                    value={formValues[field.id] || ''}
                    onChange={handleInputChange}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>
          
          {/* Add template selector */}
          <div className="mb-6 mt-6">
            <h3 className="text-lg font-semibold mb-3">Template Style</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {qrTemplates.map((template) => {
                const isPremium = !template.free && !hasFeature("premiumTemplates");
                return (
                  <div 
                    key={template.id}
                    className={`relative p-3 border rounded-lg cursor-pointer transition-all
                      ${selectedTemplate === template.id ? 'ring-2 ring-primary border-transparent' : 'border-gray-200 hover:border-gray-300'}
                      ${isPremium ? 'opacity-50' : ''}
                    `}
                    onClick={() => {
                      if (isPremium) {
                        router.push('/pricing');
                      } else {
                        setSelectedTemplate(template.id);
                      }
                    }}
                  >
                    <div className="h-12 w-full flex items-center justify-center">
                      {/* Template preview icon would go here */}
                      <div className={`h-8 w-8 p-1 flex items-center justify-center border border-gray-400
                        ${template.id === 'rounded' ? 'rounded-lg' : ''}
                        ${template.id === 'gradient' ? 'bg-gradient-to-r from-blue-400 to-purple-500' : ''}
                        ${template.id === 'dotted' ? 'border-dashed' : ''}
                        ${template.id === 'framed' ? 'p-0 border-2' : ''}
                      `}>
                        <div className="h-4 w-4 bg-gray-800"></div>
                      </div>
                    </div>
                    <p className="text-center text-sm mt-2">{template.name}</p>
                    {isPremium && (
                      <span className="absolute top-2 right-2 text-xs px-1 py-0.5 bg-blue-100 text-blue-800 rounded">
                        PRO
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
            onClick={downloadQRCode}
            disabled={!isFormValid() || !qrValue}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
            </svg>
            Generate QR Code
          </button>
        </div>
      </div>

      {/* Preview Column - Right Side */}
      <div className="flex-1">
        <div className="relative bg-white p-8 rounded-lg shadow-sm border border-neutral-200 flex flex-col items-center justify-center min-h-[300px]">
          <div className="relative">
            {qrValue ? (
              <div className="qr-container" ref={qrRef}>
                <QRCode 
                  value={qrValue} 
                  size={224} 
                  level="H" 
                  className={`
                    ${selectedTemplate === 'rounded' ? 'rounded-lg' : ''}
                    ${selectedTemplate === 'gradient' ? 'bg-gradient-to-r from-blue-400 to-purple-500 p-2' : ''}
                    ${selectedTemplate === 'dotted' ? 'p-4 border-2 border-dashed border-gray-400' : ''}
                    ${selectedTemplate === 'framed' ? 'p-4 border-4 border-gray-800' : ''}
                  `}
                />
                
                {/* Watermark for free tier */}
                {showWatermark && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute transform rotate-45 text-gray-300 text-lg font-bold opacity-50">
                      SMART QR
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gray-100 text-xs text-center py-1 opacity-70">
                      Free version - Upgrade to remove
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-56 h-56 border-2 border-dashed border-neutral-300 rounded-md flex items-center justify-center text-neutral-400">
                QR code preview
              </div>
            )}
          </div>
          
          {remainingDaily <= 2 && !hasFeature("noWatermark") && (
            <div className="mt-4 text-xs text-amber-600 bg-amber-50 p-2 rounded-md w-full text-center">
              You have {remainingDaily} QR codes remaining today. 
              <Link href="/pricing" className="ml-1 underline">Upgrade for unlimited.</Link>
            </div>
          )}
          
          <p className="text-xs text-neutral-500 mt-3 h-4">
            {qrValue && `Type: ${qrTypes.find(t => t.value === qrType)?.label}`}
          </p>
        </div>
        
        {/* Format selector */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
          <h3 className="text-lg font-semibold mb-4">Download Options</h3>
          
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image-format">
              Download Format
            </label>
            <div className="flex flex-wrap gap-3">
              {imageFormats.map((format) => {
                const isPremium = format.premium && !hasFeature(format.value === 'svg' ? 'svgDownload' : 'pdfDownload');
                return (
                  <label 
                    key={format.value} 
                    className={`inline-flex items-center ${isPremium ? 'opacity-50' : ''}`}
                    title={isPremium ? 'Premium feature - Upgrade to unlock' : ''}
                  >
                    <input
                      type="radio"
                      className="form-radio"
                      name="image-format"
                      value={format.value}
                      checked={imageFormat === format.value}
                      onChange={() => {
                        if (isPremium) {
                          router.push('/pricing');
                        } else {
                          setImageFormat(format.value as ImageFormat);
                        }
                      }}
                      disabled={isPremium}
                    />
                    <span className="ml-2">{format.label}</span>
                    {isPremium && (
                      <span className="ml-1 text-xs text-blue-600 font-semibold">PRO</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
          
          <button
            className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center"
            onClick={downloadQRCode}
            disabled={!qrValue}
          >
            <span>Download QR Code</span>
            <span className="ml-2">(.{imageFormat.toUpperCase()})</span>
          </button>
        </div>
        
        {/* Premium feature banner */}
        {subscriptionTier === 'free' && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800">Unlock Premium Features</h3>
            <p className="text-sm text-blue-600 mt-1">
              Upgrade to Pro for advanced customization options, SVG downloads, and to remove watermarks.
            </p>
            <button
              onClick={() => router.push('/pricing')}
              className="mt-2 px-4 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              View Plans
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 