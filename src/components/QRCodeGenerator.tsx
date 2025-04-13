"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import * as qrcode from "qrcode";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSubscription } from "@/context/SubscriptionProvider";
import { useTrackUsage } from "@/hooks/useTrackUsage";

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
  { id: "gradient", name: "Gradient", premium: true, tier: 'pro' },
  { id: "dotted", name: "Dotted", premium: true, tier: 'pro' },
  { id: "framed", name: "Framed", premium: true, tier: 'business' },
  { id: "logo-overlay", name: "Logo Overlay", premium: true, tier: 'business' },
];

export default function QRCodeGenerator({ onDownload }: QRCodeGeneratorProps) {
  // Use the subscription context
  const { 
    subscriptionTier,
    limits
  } = useSubscription();
  
  // Use the tracking hook
  const {
    trackUsage,
    isTracking,
    error: trackingError,
    canUseFeature,
    getRemainingUsage
  } = useTrackUsage();
  
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
  const [size] = useState<number>(200);
  const [backgroundColor] = useState<string>('#FFFFFF');
  const [foregroundColor] = useState<string>('#000000');
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
    // Moved function inside useEffect to fix the dependency warning
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
    
    updateQRValue();
  }, [qrType, formValues]);

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
      if (qrValue.trim() === "") return;
      
      // Check if user can generate QR code
      const remainingQRCodes = getRemainingUsage('qrCodesGenerated');
      
      if (remainingQRCodes <= 0) {
        alert(`You've reached your QR code generation limit for your ${subscriptionTier} plan. Please upgrade to continue.`);
        router.push('/pricing');
        return;
      }
      
      // Track usage before generating
      const trackSuccess = await trackUsage('qrCodesGenerated');
      
      if (!trackSuccess) {
        if (trackingError) {
          alert(trackingError);
        }
        return;
      }
      
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
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">QR Codes Remaining:</span>
            <span className="text-sm font-bold">{getRemainingUsage('qrCodesGenerated')}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full" 
              style={{ 
                width: `${Math.min(100, (getRemainingUsage('qrCodesGenerated') / (limits?.qrGenerationLimit || 1)) * 100)}%` 
              }}
            ></div>
          </div>
          
          {subscriptionTier === 'free' && getRemainingUsage('qrCodesGenerated') < 3 && (
            <div className="mt-2 text-xs text-amber-700">
              <Link href="/pricing" className="text-indigo-600 hover:underline">
                Upgrade your plan
              </Link>
              {' '}to generate more QR codes.
            </div>
          )}
          
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
          
          {/* Render QR templates with subscription checks */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              QR Code Style
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {qrTemplates.map((template) => {
                const isPremiumLocked = template.premium && 
                  (template.tier === 'pro' ? subscriptionTier === 'free' : 
                  template.tier === 'business' ? subscriptionTier === 'free' || subscriptionTier === 'pro' : false);
                
                return (
                  <div
                    key={template.id}
                    className={`
                      relative p-4 border rounded-lg text-center transition-all cursor-pointer
                      ${selectedTemplate === template.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}
                      ${isPremiumLocked ? 'opacity-60' : ''}
                    `}
                    onClick={() => {
                      if (!isPremiumLocked) {
                        setSelectedTemplate(template.id);
                      } else {
                        router.push('/pricing');
                      }
                    }}
                  >
                    {/* Template preview would go here */}
                    <div className="h-16 mb-2 flex items-center justify-center bg-gray-100 rounded">
                      <span className="text-xs text-gray-500">{template.name}</span>
                    </div>
                    
                    <span className="text-sm">{template.name}</span>
                    
                    {isPremiumLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-lg">
                        <div className="bg-indigo-100 text-indigo-800 text-xs py-1 px-2 rounded-full flex items-center">
                          <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          {template.tier.charAt(0).toUpperCase() + template.tier.slice(1)}+
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
            onClick={downloadQRCode}
            disabled={!isFormValid() || !qrValue || isTracking || getRemainingUsage('qrCodesGenerated') <= 0}
          >
            {isTracking ? (
              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
              </svg>
            )}
            {isTracking ? 'Generating...' : 'Generate QR Code'}
          </button>
          
          {trackingError && (
            <div className="mt-2 p-2 bg-red-50 text-red-600 text-sm rounded">
              {trackingError}
            </div>
          )}
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
                {subscriptionTier === 'free' && getRemainingUsage('qrCodesGenerated') < 3 && (
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
          
          <p className="text-xs text-neutral-500 mt-3 h-4">
            {qrValue && `Type: ${qrTypes.find(t => t.value === qrType)?.label}`}
          </p>
        </div>
        
        {/* Format selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Download Format
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {imageFormats.map((format) => {
              const isPremium = format.premium && (subscriptionTier === 'free');
              
              return (
                <button
                  key={format.value}
                  type="button"
                  onClick={() => {
                    if (!isPremium) {
                      setImageFormat(format.value as ImageFormat);
                    } else {
                      router.push('/pricing');
                    }
                  }}
                  className={`
                    px-3 py-2 text-sm font-medium rounded-md transition
                    ${imageFormat === format.value && !isPremium
                      ? 'bg-indigo-600 text-white'
                      : isPremium
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }
                    ${isPremium ? 'relative overflow-hidden' : ''}
                  `}
                >
                  {format.label}
                  {isPremium && (
                    <div className="absolute top-0 right-0 -mr-1 -mt-1 text-xs bg-indigo-200 text-indigo-800 px-1 rounded-bl">
                      PRO
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Add a subscription info section */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Your {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Plan</div>
              <div className="text-xs text-gray-500">
                {getRemainingUsage('qrGenerationLimit')} QR codes remaining
              </div>
            </div>
            
            {subscriptionTier !== 'business' && (
              <Link href="/pricing" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                Upgrade
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 