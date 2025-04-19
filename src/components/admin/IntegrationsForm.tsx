'use client';

import React, { useState, useEffect } from 'react';

// Define types for integration settings
interface FlutterwaveSettings {
  publicKey: string;
  secretKey: string;
  encryptionKey: string;
}

interface PayPalSettings {
  clientId: string;
  clientSecret: string;
}

interface StripeSettings {
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
}

interface GooglePaySettings {
  merchantId: string;
  merchantName: string;
}

interface IntegrationSettings {
  flutterwave: FlutterwaveSettings;
  paypal: PayPalSettings;
  stripe: StripeSettings;
  googlePay: GooglePaySettings;
}

type ActiveTab = 'flutterwave' | 'paypal' | 'stripe' | 'googlePay';

export default function IntegrationsForm() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('flutterwave');
  const [settings, setSettings] = useState<IntegrationSettings>({
    flutterwave: { publicKey: '', secretKey: '', encryptionKey: '' },
    paypal: { clientId: '', clientSecret: '' },
    stripe: { publicKey: '', secretKey: '', webhookSecret: '' },
    googlePay: { merchantId: '', merchantName: '' },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // TODO: Fetch current integration settings on mount
  useEffect(() => {
    console.log("Placeholder: Fetch current integration settings.");
    // Example: fetch('/api/admin/integrations').then(...)
  }, []);

  const handleInputChange = (gateway: keyof IntegrationSettings, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [gateway]: {
        ...prev[gateway],
        [name]: value,
      }
    }));
  };

  const handleSaveIntegrations = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    console.log("Saving Integration Settings (Placeholder):", settings);

    // IMPORTANT: In a real app, send this data to a secure backend endpoint.
    // The backend should encrypt sensitive keys before storing or use a proper secrets manager.
    // DO NOT store raw secrets unencrypted in your database.
    try {
      // const response = await fetch('/api/admin/integrations', { // Your secure backend endpoint
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings),
      // });
      // if (!response.ok) throw new Error('Failed to save integration settings');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSuccess('Integration settings saved successfully! (Placeholder)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // Consistent input field style
  const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";

  const renderTabContent = () => {
    switch (activeTab) {
      case 'flutterwave':
        return (
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-800">Flutterwave Settings</h3>
            <div>
              <label htmlFor="fwPublicKey" className={labelStyle}>Public Key</label>
              <input type="text" id="fwPublicKey" name="publicKey" value={settings.flutterwave.publicKey} onChange={(e) => handleInputChange('flutterwave', e)} className={inputStyle} placeholder="FLWPUBK..." />
            </div>
            <div>
              <label htmlFor="fwSecretKey" className={labelStyle}>Secret Key</label>
              <input type="password" id="fwSecretKey" name="secretKey" value={settings.flutterwave.secretKey} onChange={(e) => handleInputChange('flutterwave', e)} className={inputStyle} placeholder="FLWSECK..." />
            </div>
            <div>
              <label htmlFor="fwEncryptionKey" className={labelStyle}>Encryption Key</label>
              <input type="password" id="fwEncryptionKey" name="encryptionKey" value={settings.flutterwave.encryptionKey} onChange={(e) => handleInputChange('flutterwave', e)} className={inputStyle} placeholder="Encryption Key" />
            </div>
          </div>
        );
      case 'paypal':
        return (
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-800">PayPal Settings</h3>
            <div>
              <label htmlFor="ppClientId" className={labelStyle}>Client ID</label>
              <input type="text" id="ppClientId" name="clientId" value={settings.paypal.clientId} onChange={(e) => handleInputChange('paypal', e)} className={inputStyle} placeholder="PayPal Client ID" />
            </div>
            <div>
              <label htmlFor="ppClientSecret" className={labelStyle}>Client Secret</label>
              <input type="password" id="ppClientSecret" name="clientSecret" value={settings.paypal.clientSecret} onChange={(e) => handleInputChange('paypal', e)} className={inputStyle} placeholder="PayPal Client Secret" />
            </div>
          </div>
        );
      case 'stripe':
        return (
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-800">Stripe Settings</h3>
            <div>
              <label htmlFor="stripePublicKey" className={labelStyle}>Publishable Key</label>
              <input type="text" id="stripePublicKey" name="publicKey" value={settings.stripe.publicKey} onChange={(e) => handleInputChange('stripe', e)} className={inputStyle} placeholder="pk_live_..." />
            </div>
            <div>
              <label htmlFor="stripeSecretKey" className={labelStyle}>Secret Key</label>
              <input type="password" id="stripeSecretKey" name="secretKey" value={settings.stripe.secretKey} onChange={(e) => handleInputChange('stripe', e)} className={inputStyle} placeholder="sk_live_..." />
            </div>
             <div>
              <label htmlFor="stripeWebhookSecret" className={labelStyle}>Webhook Signing Secret</label>
              <input type="password" id="stripeWebhookSecret" name="webhookSecret" value={settings.stripe.webhookSecret} onChange={(e) => handleInputChange('stripe', e)} className={inputStyle} placeholder="whsec_..." />
            </div>
          </div>
        );
      case 'googlePay':
        return (
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-800">Google Pay Settings</h3>
             <div>
              <label htmlFor="gpMerchantId" className={labelStyle}>Merchant ID</label>
              <input type="text" id="gpMerchantId" name="merchantId" value={settings.googlePay.merchantId} onChange={(e) => handleInputChange('googlePay', e)} className={inputStyle} placeholder="Google Pay Merchant ID" />
            </div>
             <div>
              <label htmlFor="gpMerchantName" className={labelStyle}>Merchant Name</label>
              <input type="text" id="gpMerchantName" name="merchantName" value={settings.googlePay.merchantName} onChange={(e) => handleInputChange('googlePay', e)} className={inputStyle} placeholder="Your Merchant Name Displayed to Users" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getTabClass = (tabName: ActiveTab) => {
    return `px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors border-b-2 ${activeTab === tabName ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">Payment Integrations</h2>
      <form onSubmit={handleSaveIntegrations} className="space-y-6">
        {error && <p className="text-red-600 bg-red-50 p-3 rounded-md text-sm">Error: {error}</p>}
        {success && <p className="text-green-600 bg-green-50 p-3 rounded-md text-sm">{success}</p>}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1" aria-label="Tabs">
            <button type="button" onClick={() => setActiveTab('flutterwave')} className={getTabClass('flutterwave')}>Flutterwave</button>
            <button type="button" onClick={() => setActiveTab('paypal')} className={getTabClass('paypal')}>PayPal</button>
            <button type="button" onClick={() => setActiveTab('stripe')} className={getTabClass('stripe')}>Stripe</button>
            <button type="button" onClick={() => setActiveTab('googlePay')} className={getTabClass('googlePay')}>Google Pay</button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-5 p-4 border border-gray-200 rounded-md bg-gray-50/50 min-h-[200px]">
          {renderTabContent()}
        </div>
        
        {/* Security Note */}
        <p className="text-xs text-red-600 pt-1">Warning: API keys and secrets are sensitive. Ensure your backend handles these securely.</p>

        {/* Save Button */}
        <div className="pt-2 text-right">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Integration Settings'}
          </button>
        </div>
      </form>
    </div>
  );
} 