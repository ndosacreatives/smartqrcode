'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/FirebaseAuthContext';
import { FirebaseError } from 'firebase/app';
import { PhoneAuthProvider } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Add type declaration for confirmationResult
declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

const PhoneSignup = () => {
  const { 
    user,
    loading: authLoading,
    setupRecaptcha, 
    sendPhoneVerificationCode, 
    verifyPhoneCode 
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/';
  
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [verificationStep, setVerificationStep] = useState<'inputPhone' | 'verifying'>('inputPhone');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Create a ref for the recaptcha container
  const recaptchaRef = useRef(null);

  useEffect(() => {
    // If user is already logged in, redirect
    if (user) {
      router.push(redirect);
    }
  }, [user, router, redirect]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Ensure phone number is in E.164 format
      let formattedNumber = phoneNumber;
      if (!phoneNumber.startsWith('+')) {
        formattedNumber = `+${phoneNumber}`;
      }

      // Create a recaptcha verifier with invisible size
      const recaptchaVerifier = await setupRecaptcha('submit-button');
      
      // Send verification code
      const verificationId = await sendPhoneVerificationCode(formattedNumber, recaptchaVerifier);
      window.confirmationResult = verificationId;
      
      setVerificationStep('verifying');
      setSuccessMessage(`Verification code sent to ${formattedNumber}`);
    } catch (error: any) {
      console.error('Error sending code:', error);
      let errorMessage = 'Failed to send verification code. Please try again.';
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please enter a valid phone number.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'reCAPTCHA verification failed. Please refresh the page and try again.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Phone authentication is not enabled for this region. Please contact the app administrator.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!window.confirmationResult) {
        throw new Error('Verification session expired. Please request a new code.');
      }

      await verifyPhoneCode(
        window.confirmationResult,
        verificationCode,
        displayName
      );

      setSuccessMessage('Phone verification successful! Redirecting...');
      
      // Redirect user after successful verification
      setTimeout(() => {
        router.push(redirect);
      }, 1500);
    } catch (error: any) {
      console.error('Error verifying code:', error);
      let errorMessage = 'Invalid verification code. Please try again.';
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'The verification code is invalid. Please check and try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'The verification code has expired. Please request a new code.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {verificationStep === 'inputPhone' ? 'Sign in with Phone' : 'Verify Phone Number'}
          </h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        {verificationStep === 'inputPhone' ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendCode}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="phone-number" className="sr-only">Phone Number</label>
                <input
                  id="phone-number"
                  name="phone"
                  type="tel"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Phone Number (e.g. +1234567890)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="display-name" className="sr-only">Display Name (Optional)</label>
                <input
                  id="display-name"
                  name="displayName"
                  type="text"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Display Name (Optional)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <p>Please enter your phone number in international format (e.g., +1 for US, +44 for UK).</p>
            </div>

            <div>
              <button
                id="submit-button"
                type="submit"
                disabled={loading || !phoneNumber}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  loading || !phoneNumber
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyCode}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="verification-code" className="sr-only">Verification Code</label>
                <input
                  id="verification-code"
                  name="code"
                  type="text"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter 6-digit verification code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <p>Enter the 6-digit code sent to your phone.</p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  loading || verificationCode.length !== 6
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Verify Code'
                )}
              </button>
            </div>

            <div className="text-center">
              <button 
                type="button" 
                onClick={() => setVerificationStep('inputPhone')}
                className="text-blue-600 hover:text-blue-800"
              >
                Use a different phone number
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <div className="text-sm">
            <Link 
              href={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in with email instead
            </Link>
          </div>
          <div className="text-sm mt-2">
            <Link 
              href={`/signup${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Create a new account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneSignup; 