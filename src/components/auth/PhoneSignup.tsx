'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/FirebaseAuthContext';
import { RecaptchaVerifier } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// Add type declaration for the global RecaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
  }
}

interface PhoneSignupProps {
  onSuccess?: () => void;
  redirectUrl?: string;
}

const PhoneSignup: React.FC<PhoneSignupProps> = ({ 
  onSuccess, 
  redirectUrl = '/profile'
}) => {
  const { user, loading, setupRecaptcha, sendPhoneVerificationCode, verifyPhoneCode } = useAuth();
  const router = useRouter();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  
  // Consistent styles
  const inputStyle = "w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
  const buttonStyle = "w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200";
  
  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirectUrl);
      }
    }
  }, [user, loading, router, onSuccess, redirectUrl]);
  
  // Initialize reCAPTCHA when component mounts
  useEffect(() => {
    let mounted = true;
    
    const initRecaptcha = async () => {
      if (!recaptchaContainerRef.current || recaptchaVerifierRef.current) {
        return; // Already initialized or no container
      }
      
      try {
        // Clear the container first to avoid potential issues
        if (recaptchaContainerRef.current) {
          recaptchaContainerRef.current.innerHTML = '';
        }
        
        console.log('Initializing reCAPTCHA...');
        const verifier = await setupRecaptcha('recaptcha-container');
        
        // Only set the ref if the component is still mounted
        if (mounted) {
          recaptchaVerifierRef.current = verifier;
          console.log('reCAPTCHA initialized successfully');
        } else {
          // Component unmounted during initialization, clean up
          try {
            (verifier as any).clear?.();
          } catch (err) {
            console.error('Error clearing unmounted reCAPTCHA:', err);
          }
        }
      } catch (err) {
        console.error('Failed to initialize reCAPTCHA:', err);
        if (mounted) {
          setError('Failed to initialize verification. Please refresh the page and try again.');
        }
      }
    };
    
    if (!loading) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (mounted) {
          initRecaptcha();
        }
      }, 100);
    }
    
    // Clean up recaptcha when component unmounts
    return () => {
      mounted = false;
      try {
        if (recaptchaVerifierRef.current) {
          console.log('Clearing reCAPTCHA on unmount');
          (recaptchaVerifierRef.current as any).clear?.();
          recaptchaVerifierRef.current = null;
        }
      } catch (err) {
        console.error('Failed to clear reCAPTCHA on unmount:', err);
      }
    };
  }, [loading, setupRecaptcha]);
  
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      setError('Phone number is required');
      return;
    }
    
    // Format phone number - ensure it has the international prefix
    let formattedPhoneNumber = phoneNumber;
    if (!formattedPhoneNumber.startsWith('+')) {
      formattedPhoneNumber = `+${formattedPhoneNumber}`;
    }
    
    setAuthLoading(true);
    setError(null);
    
    try {
      if (!recaptchaVerifierRef.current) {
        // If reCAPTCHA isn't ready, try initializing with a timeout
        console.log('No reCAPTCHA instance found, attempting to initialize...');
        
        // Clear container first
        if (recaptchaContainerRef.current) {
          recaptchaContainerRef.current.innerHTML = '';
        }
        
        try {
          // Create a fresh instance
          const verifier = await setupRecaptcha('recaptcha-container');
          recaptchaVerifierRef.current = verifier;
          console.log('New reCAPTCHA initialized on demand');
        } catch (initError) {
          console.error('Failed to initialize reCAPTCHA on demand:', initError);
          throw new Error('Could not initialize verification system. Please refresh the page and try again.');
        }
      }
      
      console.log('Sending verification code to:', formattedPhoneNumber);
      const verifyId = await sendPhoneVerificationCode(formattedPhoneNumber, recaptchaVerifierRef.current);
      
      console.log('Verification code sent successfully');
      setVerificationId(verifyId);
      setIsCodeSent(true);
      setRecaptchaVerified(true);
    } catch (err: any) {
      console.error('Error sending verification code:', err);
      
      // Provide more specific error messages
      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Please include country code (e.g., +1 for US).');
      } else if (err.code === 'auth/captcha-check-failed') {
        setError('reCAPTCHA verification failed. Please try again.');
      } else if (err.code === 'auth/quota-exceeded') {
        setError('SMS quota exceeded. Please try again later.');
      } else if (err.code === 'auth/internal-error') {
        setError('Firebase internal error. Please refresh the page and try again.');
      } else {
        setError(err.message || 'Failed to send verification code');
      }
      
      // Reset recaptcha only if it exists
      try {
        if (recaptchaVerifierRef.current) {
          console.log('Clearing problematic reCAPTCHA');
          (recaptchaVerifierRef.current as any).clear?.();
          recaptchaVerifierRef.current = null;
          
          // Try to create a fresh instance after a short delay
          setTimeout(async () => {
            try {
              if (recaptchaContainerRef.current) {
                recaptchaContainerRef.current.innerHTML = '';
                const verifier = await setupRecaptcha('recaptcha-container');
                recaptchaVerifierRef.current = verifier;
                console.log('Fresh reCAPTCHA created after error');
              }
            } catch (e) {
              console.error('Failed to recreate reCAPTCHA after error:', e);
            }
          }, 500);
        }
      } catch (clearErr) {
        console.error('Error clearing reCAPTCHA:', clearErr);
      }
    } finally {
      setAuthLoading(false);
    }
  };
  
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode) {
      setError('Verification code is required');
      return;
    }
    
    if (!verificationId) {
      setError('Please request a verification code first');
      return;
    }
    
    setAuthLoading(true);
    setError(null);
    
    try {
      await verifyPhoneCode(verificationId, verificationCode, displayName || undefined);
      
      // Verification successful
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirectUrl);
      }
    } catch (err: any) {
      console.error('Error verifying code:', err);
      setError(err.message || 'Failed to verify code');
    } finally {
      setAuthLoading(false);
    }
  };
  
  const initRecaptcha = async () => {
    if (recaptchaContainerRef.current) {
      try {
        recaptchaVerifierRef.current = await setupRecaptcha('recaptcha-container');
      } catch (err) {
        console.error('Failed to re-initialize reCAPTCHA:', err);
      }
    }
  };
  
  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  // Don't show the signup form if already logged in
  if (user) {
    return null; // useEffect will handle redirect
  }
  
  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Phone Authentication</h2>
      
      {error && (
        <div className="mb-5 p-3 bg-red-100 text-red-700 rounded-md border border-red-200 flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {!isCodeSent ? (
        <form onSubmit={handleSendCode} className="space-y-5">
          <div>
            <label htmlFor="phoneNumber" className={labelStyle}>
              Phone Number
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              required
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={inputStyle}
            />
            <p className="mt-1.5 text-xs text-gray-500">Include country code (e.g., +1 for US)</p>
          </div>
          
          <div>
            <label htmlFor="displayName" className={labelStyle}>
              Display Name (optional)
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputStyle}
              placeholder="Your name"
            />
          </div>
          
          {/* reCAPTCHA container - ensure it has adequate height */}
          <div className="mt-5 mb-5">
            <p className="text-sm text-gray-500 mb-2">Please complete the verification below:</p>
            <div 
              id="recaptcha-container" 
              className="flex justify-center items-center min-h-[80px] border border-gray-200 rounded p-2" 
              ref={recaptchaContainerRef}
            ></div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={authLoading}
              className={buttonStyle}
            >
              {authLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : 'Send Verification Code'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-5">
          <div>
            <label htmlFor="verificationCode" className={labelStyle}>
              Verification Code
            </label>
            <input
              id="verificationCode"
              name="verificationCode"
              type="text"
              required
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className={inputStyle}
            />
            <p className="mt-1.5 text-xs text-gray-500">Enter the code sent to your phone</p>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                setIsCodeSent(false);
                setVerificationId(null);
                setVerificationCode('');
                // Reset recaptcha if needed
                if (recaptchaVerified && recaptchaVerifierRef.current) {
                  (recaptchaVerifierRef.current as any).clear?.();
                  initRecaptcha();
                }
              }}
              disabled={authLoading}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
            >
              Change Phone Number
            </button>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={authLoading}
              className={buttonStyle}
            >
              {authLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : 'Verify & Sign In'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PhoneSignup; 