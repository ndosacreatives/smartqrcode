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
  AuthCredential
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
  setupRecaptcha: (containerId: string) => Promise<RecaptchaVerifier>;
  sendPhoneVerificationCode: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<string>;
  verifyPhoneCode: (verificationId: string, code: string, displayName?: string) => Promise<void>;
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

  // Setup recaptcha for phone auth
  const setupRecaptcha = async (containerId: string): Promise<RecaptchaVerifier> => {
    try {
      // Clean up any existing reCAPTCHA widgets before creating a new one
      const container = document.getElementById(containerId);
      if (container) {
        // Clear the container to avoid multiple instances
        container.innerHTML = '';
      }
      
      const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        'size': 'normal',
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          console.log('reCAPTCHA verified successfully');
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          console.log('reCAPTCHA verification expired');
        }
      });
      
      // Force clear any existing renders before rendering again
      try {
        await recaptchaVerifier.clear();
      } catch (e) {
        // Ignore errors from clearing non-existent recaptcha
        console.log('No existing reCAPTCHA to clear');
      }
      
      await recaptchaVerifier.render();
      return recaptchaVerifier;
    } catch (error) {
      console.error('Error setting up recaptcha:', error);
      throw error;
    }
  };
  
  // Send verification code for phone sign-in
  const sendPhoneVerificationCode = async (
    phoneNumber: string, 
    recaptchaVerifier: RecaptchaVerifier
  ): Promise<string> => {
    try {
      setLoading(true);
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return confirmationResult.verificationId;
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Verify phone code and sign in or sign up user
  const verifyPhoneCode = async (
    verificationId: string, 
    code: string,
    displayName?: string
  ): Promise<void> => {
    try {
      setLoading(true);
      
      // Create the phone auth credential
      const phoneCredential = PhoneAuthProvider.credential(verificationId, code);
      
      // Sign in with the credential
      const userCredential = await signInWithCredential(auth, phoneCredential);
      
      // Check if this is a new user 
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // New user - create their profile
        // If displayName is provided, update the user profile
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
        
        // Save user to Firestore with proper structure
        await saveUserData({
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          phoneNumber: userCredential.user.phoneNumber || '',
          displayName: displayName || userCredential.user.displayName || '',
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
          authProvider: 'phone',
        });
      }
    } catch (error) {
      console.error('Error verifying phone code:', error);
      throw error;
    } finally {
      setLoading(false);
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