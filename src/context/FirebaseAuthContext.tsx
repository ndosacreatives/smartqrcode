"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  linkWithCredential,
  signInWithCredential,
  AuthCredential,
  ConfirmationResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { saveUserData, getUserData, UserData } from '@/lib/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  // Phone authentication methods
  setupRecaptcha: (buttonId: string) => Promise<RecaptchaVerifier>;
  sendPhoneVerificationCode: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyPhoneCode: (confirmationResult: ConfirmationResult, verificationCode: string, displayName?: string) => Promise<User>;
  linkPhoneWithCurrentUser: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<string>;
  verifyPhoneLinkCode: (verificationId: string, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      // If user is logged in, update their lastLogin time
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, {
            lastLogin: Timestamp.now()
          });
        } catch (error) {
          console.error('Error updating last login time:', error);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      await updateProfile(userCredential.user, { displayName });
      
      // Save user to Firestore with proper structure
      await saveUserData({
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: displayName,
        subscriptionTier: 'free',
        role: 'user',
        authProvider: 'email',
        featuresUsage: {
          qrCodesGenerated: 0,
          barcodesGenerated: 0,
          bulkGenerations: 0,
          aiCustomizations: 0
        },
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      });
    } finally {
      setLoading(false);
    }
  };

  // Alias for signUp to make API more intuitive
  const register = signUp;

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setLoading(false);
    }
  };

  // Alias for signIn to make API more intuitive
  const login = signIn;

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check if this is a new user (first time sign-in with Google)
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Save user to Firestore with proper structure for new Google sign-ins
        await saveUserData({
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          displayName: userCredential.user.displayName || '',
          photoURL: userCredential.user.photoURL || '',
          subscriptionTier: 'free',
          role: 'user',
          featuresUsage: {
            qrCodesGenerated: 0,
            barcodesGenerated: 0,
            bulkGenerations: 0,
            aiCustomizations: 0
          },
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
          authProvider: 'google',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (displayName: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, { displayName });
      
      // Update Firestore user document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName,
        updatedAt: Timestamp.now()
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Setup recaptcha verifier
  const setupRecaptcha = async (buttonId: string): Promise<RecaptchaVerifier> => {
    try {
      // Clean up any existing recaptcha verifier
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (error) {
          console.error('Error clearing existing recaptcha:', error);
        }
      }

      // Create a new invisible recaptcha verifier
      const recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
        size: 'invisible',
        callback: () => {
          console.log('Captcha resolved');
        },
        'expired-callback': () => {
          console.log('Captcha expired');
        }
      });

      // Store the verifier globally
      window.recaptchaVerifier = recaptchaVerifier;
      
      // Render the recaptcha to ensure it's ready
      await recaptchaVerifier.render();
      
      return recaptchaVerifier;
    } catch (error) {
      console.error('Error setting up recaptcha:', error);
      throw error;
    }
  };

  // Send phone verification code
  const sendPhoneVerificationCode = async (
    phoneNumber: string,
    recaptchaVerifier: RecaptchaVerifier
  ): Promise<ConfirmationResult> => {
    try {
      // Make sure phone number is in international format (E.164)
      let formattedNumber = phoneNumber;
      if (!formattedNumber.startsWith('+')) {
        formattedNumber = `+${formattedNumber}`;
      }
      
      // Set language code before sending verification code
      auth.languageCode = 'en';
      
      console.log(`Sending verification code to ${formattedNumber}`);
      
      // Send verification code using Firebase
      const confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, recaptchaVerifier);
      
      console.log('Verification code sent successfully');
      window.confirmationResult = confirmationResult;
      return confirmationResult;
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      
      // Handle specific error for region not enabled
      if (error.code === 'auth/operation-not-allowed') {
        console.error('Phone authentication is not enabled in the Firebase console or region is not allowed.');
        throw new Error(
          'Phone authentication has not been enabled for this region. Please contact the app administrator.'
        );
      }
      
      throw error;
    }
  };

  // Verify phone code
  const verifyPhoneCode = async (
    confirmationResult: ConfirmationResult,
    verificationCode: string,
    displayName?: string
  ) => {
    try {
      const userCredential = await confirmationResult.confirm(verificationCode);
      
      // Update display name if provided
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      }
      
      // Save user data
      if (userCredential.user) {
        // Create userData object to merge with the user
        const userData: Partial<UserData> = {
          id: userCredential.user.uid,
          authProvider: 'phone',
          phoneNumber: userCredential.user.phoneNumber || '',
          displayName: displayName || userCredential.user.displayName || '',
          email: userCredential.user.email || '',
          role: 'user',
          subscriptionTier: 'free',
          featuresUsage: {
            qrCodesGenerated: 0,
            barcodesGenerated: 0,
            bulkGenerations: 0,
            aiCustomizations: 0
          }
        };
        
        // Call saveUserData with the userData object
        await saveUserData(userData as UserData);
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('Error verifying code:', error);
      throw error;
    }
  };
  
  // Link phone with current user
  const linkPhoneWithCurrentUser = async (
    phoneNumber: string, 
    recaptchaVerifier: RecaptchaVerifier
  ): Promise<string> => {
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    
    try {
      setLoading(true);
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return confirmationResult.verificationId;
    } catch (error) {
      console.error('Error sending verification code for linking:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Verify code for linking phone with current user
  const verifyPhoneLinkCode = async (verificationId: string, code: string): Promise<void> => {
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    
    try {
      setLoading(true);
      
      // Create the phone auth credential
      const phoneCredential = PhoneAuthProvider.credential(verificationId, code);
      
      // Link the credential with the current user
      await linkWithCredential(user, phoneCredential);
      
      // Update user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        phoneNumber: user.phoneNumber,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error verifying phone link code:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    logout,
    resetPassword,
    register,
    login,
    loginWithGoogle,
    updateUserProfile,
    // Phone auth methods
    setupRecaptcha,
    sendPhoneVerificationCode,
    verifyPhoneCode,
    linkPhoneWithCurrentUser,
    verifyPhoneLinkCode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 