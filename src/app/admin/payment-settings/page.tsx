'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/FirebaseAuthContext';
import { 
  StripeCredentials, 
  PayPalCredentials, 
  FlutterwaveCredentials 
} from '@/lib/types';

export default function PaymentSettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'stripe' | 'paypal' | 'flutterwave'>('stripe');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Credentials state
  const [stripeCredentials, setStripeCredentials] = useState<StripeCredentials>({
    secretKey: '',
    publicKey: '',
    webhookSecret: '',
    pricePro: '',
    priceBusiness: ''
  });
  
  const [paypalCredentials, setPaypalCredentials] = useState<PayPalCredentials>({
    clientId: '',
    clientSecret: '',
    planIdPro: '',
    planIdBusiness: ''
  });
  
  const [flutterwaveCredentials, setFlutterwaveCredentials] = useState<FlutterwaveCredentials>({
    publicKey: '',
    secretKey: '',
    encryptionKey: ''
  });
  
  const [providersStatus, setProvidersStatus] = useState({
    stripe: false,
    paypal: false,
    flutterwave: false
  });

  // Fetch existing payment credentials
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/admin/payment-settings', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch payment settings');
        }
        
        const data = await response.json();
        
        // Update provider status
        setProvidersStatus({
          stripe: !!data.stripe?.isActive,
          paypal: !!data.paypal?.isActive,
          flutterwave: !!data.flutterwave?.isActive
        });
        
        // Set credentials if they exist
        if (data.stripe?.credentials) {
          setStripeCredentials(data.stripe.credentials);
        }
        
        if (data.paypal?.credentials) {
          setPaypalCredentials(data.paypal.credentials);
        }
        
        if (data.flutterwave?.credentials) {
          setFlutterwaveCredentials(data.flutterwave.credentials);
        }
        
      } catch (err) {
        console.error('Error fetching payment settings:', err);
        setError('Failed to load payment settings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCredentials();
  }, []);

  // Save credentials
  const saveCredentials = async (provider: 'stripe' | 'paypal' | 'flutterwave') => {
    try {
      setSaving(true);
      setError(null);
      
      let credentialsData;
      switch (provider) {
        case 'stripe':
          credentialsData = stripeCredentials;
          break;
        case 'paypal':
          credentialsData = paypalCredentials;
          break;
        case 'flutterwave':
          credentialsData = flutterwaveCredentials;
          break;
      }
      
      const response = await fetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          isActive: providersStatus[provider],
          credentials: credentialsData
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save credentials');
      }
      
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error(`Error saving ${provider} credentials:`, err);
      setError(err instanceof Error ? err.message : 'Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  // Toggle provider status
  const toggleProviderStatus = (provider: 'stripe' | 'paypal' | 'flutterwave') => {
    setProvidersStatus(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  // Handle input changes
  const handleStripeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStripeCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePayPalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaypalCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFlutterwaveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFlutterwaveCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Testing a connection
  const testConnection = async (provider: 'stripe' | 'paypal' | 'flutterwave') => {
    try {
      setLoading(true);
      setError(null);
      
      let credentialsData;
      switch (provider) {
        case 'stripe':
          credentialsData = stripeCredentials;
          break;
        case 'paypal':
          credentialsData = paypalCredentials;
          break;
        case 'flutterwave':
          credentialsData = flutterwaveCredentials;
          break;
      }
      
      const response = await fetch('/api/admin/payment-settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          credentials: credentialsData
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Connection test failed');
      }
      
      alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} connection test successful!`);
      
    } catch (err) {
      console.error(`Error testing ${provider} connection:`, err);
      setError(err instanceof Error ? err.message : 'Connection test failed');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">Loading payment settings...</span>
      </div>
    );
  }

  // Tabs for different payment providers
  const renderTabs = () => (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          onClick={() => setActiveTab('stripe')}
          className={`${
            activeTab === 'stripe'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          Stripe
        </button>
        <button
          onClick={() => setActiveTab('paypal')}
          className={`${
            activeTab === 'paypal'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          PayPal
        </button>
        <button
          onClick={() => setActiveTab('flutterwave')}
          className={`${
            activeTab === 'flutterwave'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          Flutterwave
        </button>
      </nav>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment Settings</h1>
        
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">Credentials saved successfully!</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {renderTabs()}
          
          <div className="p-4 sm:p-6">
            {activeTab === 'stripe' && (
              <div>
                <div className="mb-4 flex items-center">
                  <h2 className="text-lg font-medium text-gray-900">Stripe Payment Settings</h2>
                  <div className="ml-auto flex items-center">
                    <span className="mr-2 text-sm text-gray-500">Active</span>
                    <button
                      type="button"
                      className={`${
                        providersStatus.stripe ? 'bg-indigo-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none`}
                      onClick={() => toggleProviderStatus('stripe')}
                    >
                      <span className={`${
                        providersStatus.stripe ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200`}></span>
                    </button>
                  </div>
                </div>
                
                <div className="mt-5 border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500 mb-4">
                    Enter your Stripe API credentials. These will be stored securely and used for payment processing.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700">
                        Secret Key
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="secretKey"
                          id="secretKey"
                          autoComplete="off"
                          value={stripeCredentials.secretKey}
                          onChange={handleStripeChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="publicKey" className="block text-sm font-medium text-gray-700">
                        Public Key
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="publicKey"
                          id="publicKey"
                          autoComplete="off"
                          value={stripeCredentials.publicKey}
                          onChange={handleStripeChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-4">
                      <label htmlFor="webhookSecret" className="block text-sm font-medium text-gray-700">
                        Webhook Secret
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="webhookSecret"
                          id="webhookSecret"
                          autoComplete="off"
                          value={stripeCredentials.webhookSecret}
                          onChange={handleStripeChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="pricePro" className="block text-sm font-medium text-gray-700">
                        Pro Plan Price ID
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="pricePro"
                          id="pricePro"
                          value={stripeCredentials.pricePro}
                          onChange={handleStripeChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="priceBusiness" className="block text-sm font-medium text-gray-700">
                        Business Plan Price ID
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="priceBusiness"
                          id="priceBusiness"
                          value={stripeCredentials.priceBusiness}
                          onChange={handleStripeChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => testConnection('stripe')}
                      disabled={saving || !stripeCredentials.secretKey || !stripeCredentials.publicKey}
                      className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      Test Connection
                    </button>
                    <button
                      type="button"
                      onClick={() => saveCredentials('stripe')}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                    >
                      {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'paypal' && (
              <div>
                <div className="mb-4 flex items-center">
                  <h2 className="text-lg font-medium text-gray-900">PayPal Payment Settings</h2>
                  <div className="ml-auto flex items-center">
                    <span className="mr-2 text-sm text-gray-500">Active</span>
                    <button
                      type="button"
                      className={`${
                        providersStatus.paypal ? 'bg-indigo-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none`}
                      onClick={() => toggleProviderStatus('paypal')}
                    >
                      <span className={`${
                        providersStatus.paypal ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200`}></span>
                    </button>
                  </div>
                </div>
                
                <div className="mt-5 border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500 mb-4">
                    Enter your PayPal API credentials. These will be stored securely and used for payment processing.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
                        Client ID
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="clientId"
                          id="clientId"
                          autoComplete="off"
                          value={paypalCredentials.clientId}
                          onChange={handlePayPalChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700">
                        Client Secret
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="clientSecret"
                          id="clientSecret"
                          autoComplete="off"
                          value={paypalCredentials.clientSecret}
                          onChange={handlePayPalChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="planIdPro" className="block text-sm font-medium text-gray-700">
                        Pro Plan ID
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="planIdPro"
                          id="planIdPro"
                          value={paypalCredentials.planIdPro}
                          onChange={handlePayPalChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="planIdBusiness" className="block text-sm font-medium text-gray-700">
                        Business Plan ID
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="planIdBusiness"
                          id="planIdBusiness"
                          value={paypalCredentials.planIdBusiness}
                          onChange={handlePayPalChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => testConnection('paypal')}
                      disabled={saving || !paypalCredentials.clientId || !paypalCredentials.clientSecret}
                      className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      Test Connection
                    </button>
                    <button
                      type="button"
                      onClick={() => saveCredentials('paypal')}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                    >
                      {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'flutterwave' && (
              <div>
                <div className="mb-4 flex items-center">
                  <h2 className="text-lg font-medium text-gray-900">Flutterwave Payment Settings</h2>
                  <div className="ml-auto flex items-center">
                    <span className="mr-2 text-sm text-gray-500">Active</span>
                    <button
                      type="button"
                      className={`${
                        providersStatus.flutterwave ? 'bg-indigo-600' : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none`}
                      onClick={() => toggleProviderStatus('flutterwave')}
                    >
                      <span className={`${
                        providersStatus.flutterwave ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200`}></span>
                    </button>
                  </div>
                </div>
                
                <div className="mt-5 border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500 mb-4">
                    Enter your Flutterwave API credentials. These will be stored securely and used for payment processing.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="publicKey" className="block text-sm font-medium text-gray-700">
                        Public Key
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="publicKey"
                          id="publicKey"
                          autoComplete="off"
                          value={flutterwaveCredentials.publicKey}
                          onChange={handleFlutterwaveChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700">
                        Secret Key
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="secretKey"
                          id="secretKey"
                          autoComplete="off"
                          value={flutterwaveCredentials.secretKey}
                          onChange={handleFlutterwaveChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="encryptionKey" className="block text-sm font-medium text-gray-700">
                        Encryption Key
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="encryptionKey"
                          id="encryptionKey"
                          autoComplete="off"
                          value={flutterwaveCredentials.encryptionKey}
                          onChange={handleFlutterwaveChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => testConnection('flutterwave')}
                      disabled={saving || !flutterwaveCredentials.publicKey || !flutterwaveCredentials.secretKey}
                      className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      Test Connection
                    </button>
                    <button
                      type="button"
                      onClick={() => saveCredentials('flutterwave')}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                    >
                      {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-4 py-5 sm:p-6">
            <div className="text-sm text-gray-500">
              <p className="font-medium text-gray-700 mb-1">Security Information</p>
              <p>
                Payment provider credentials are encrypted before being stored in the database. 
                The encryption key is stored securely on the server and not accessible from client-side code.
              </p>
              <p className="mt-2">
                We recommend regularly rotating your API credentials as a security best practice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 