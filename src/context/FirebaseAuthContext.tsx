"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  UserCredential,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  linkWithCredential,
  signInWithCredential,
  AuthCredential,
  ConfirmationResult,
  sendEmailVerification,
  applyActionCode,
  deleteUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { auth, db, getRecaptchaVerifier } from '@/lib/firebase';
import { googleProvider, isProviderEnabled } from '@/lib/authProviders';
import { saveUserData, getUserData, UserData, checkEmailOrPhoneExists } from '@/lib/firestore';
import { useRouter } from 'next/navigation';

// Add typing for window object
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
    confirmationResult: ConfirmationResult | null;
    phoneNumber: string | null;
  }
}

export interface AuthContextType {
  user: User | UserData | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updateUserProfile: (displayName: string) => Promise<boolean>;
  register: (userData: RegistrationData) => Promise<boolean>;
  setupRecaptcha: (phoneNumber: string) => Promise<ConfirmationResult>;
  verifyPhoneCode: (code: string, confirmationResult: ConfirmationResult) => Promise<boolean>;
  linkPhoneWithCurrentUser: (phoneNumber: string, code: string) => Promise<boolean>;
  clearError: () => void;
  deleteUserAccount: () => Promise<boolean>;
  sendVerificationEmail: () => Promise<boolean>;
  linkPhoneWithEmail: (email: string, phoneNumber: string, code: string) => Promise<boolean>;
  verifyEmail: (actionCode: string) => Promise<boolean>;
  isEmailVerified: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}

// Adding password field to UserData interface for registration
interface RegistrationData extends UserData {
  password: string;
}

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Store token in localStorage when user changes
  useEffect(() => {
    if (user) {
      // Get fresh token and store it
      user.getIdToken(true)
        .then(token => {
          console.log('Auth: Storing fresh token in localStorage');
          localStorage.setItem('firebase-auth-token', token);
        })
        .catch(err => {
          console.error('Auth: Error storing token:', err);
        });
    } else {
      // Clear token on logout
      localStorage.removeItem('firebase-auth-token');
    }
  }, [user]);

  // Listen for auth state changes
  useEffect(() => {
    console.log('Auth: Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        if (authUser) {
          console.log(`Auth: User authenticated: ${authUser.uid}`);
          setUser(authUser);
          
          // Store token whenever auth state changes
          const token = await authUser.getIdToken(true);
          localStorage.setItem('firebase-auth-token', token);
        } else {
          console.log('Auth: No user authenticated');
          setUser(null);
          localStorage.removeItem('firebase-auth-token');
        }
      } catch (err) {
        console.error('Auth: Error in auth state change handler:', err);
        setError(err instanceof Error ? err.message : 'Authentication error');
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => {
      console.log('Auth: Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  // Get ID token with refresh
  const getIdToken = async (): Promise<string | null> => {
    try {
      if (user) {
        console.log('Auth: Getting fresh ID token from user');
        const token = await user.getIdToken(true);
        localStorage.setItem('firebase-auth-token', token);
        return token;
      }
      
      // Try to get from localStorage if no user
      const storedToken = localStorage.getItem('firebase-auth-token');
      if (storedToken) {
        console.log('Auth: Retrieved token from localStorage');
        return storedToken;
      }
      
      console.log('Auth: No token available');
      return null;
    } catch (err) {
      console.error('Auth: Error getting ID token:', err);
      return null;
    }
  };

  const signUp = async (email: string, password: string, displayName: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // First check if the email already exists
      const { exists, field } = await checkEmailOrPhoneExists(email);
      if (exists && field) {
        setError(`This ${field === 'email' ? 'email' : 'phone number'} is already associated with an account. Please use a different ${field === 'email' ? 'email' : 'phone number'} or sign in.`);
        return false;
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, { displayName });
      
      // Save user data to Firestore
      await saveUserData(user);
      
      // Send verification email
      await sendEmailVerification(user);
      
      return true;
    } catch (err) {
      console.error('Sign up error:', err);
      if (err instanceof Error) {
        // Handle Firebase auth errors more specifically
        if (err.message.includes('email-already-in-use')) {
          setError('This email is already associated with an account. Please use a different email or sign in.');
        } else if (err.message.includes('invalid-email')) {
          setError('Please enter a valid email address.');
        } else if (err.message.includes('weak-password')) {
          setError('Password is too weak. Please use a stronger password.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Sign up failed. Please try again.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update register function to accept the extended interface
  const register = async (userData: RegistrationData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }
      
      // Check if email or phone already exists
      const { exists, field } = await checkEmailOrPhoneExists(userData.email, userData.phoneNumber);
      if (exists && field) {
        const fieldName = field === 'email' ? 'email' : 'phone number';
        setError(`This ${fieldName} is already associated with an account. Please use a different ${fieldName} or sign in.`);
        setLoading(false);
        return false;
      }
      
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const user = userCredential.user;
      
      if (userData.displayName) {
        await updateProfile(user, { displayName: userData.displayName });
      }
      
      // Send verification email
      await sendEmailVerification(user);
      
      // Save additional user data to Firestore
      const userDataToSave: UserData = {
        id: user.uid,
        email: userData.email,
        displayName: userData.displayName,
        emailVerified: Boolean(user.emailVerified), // Cast to boolean
        phoneNumber: userData.phoneNumber,
        role: 'user',
        subscriptionTier: 'free',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        featuresUsage: {
          qrCodesGenerated: 0,
          barcodesGenerated: 0,
          bulkGenerations: 0,
          aiCustomizations: 0
        }
      };
      
      await saveUserData(userDataToSave);
      
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err instanceof Error) {
        // Extract and format Firebase error messages
        if (err.message.includes('email-already-in-use')) {
          setError('This email is already associated with an account. Please use a different email or sign in.');
        } else if (err.message.includes('invalid-email')) {
          setError('Please enter a valid email address.');
        } else if (err.message.includes('weak-password')) {
          setError('Password is too weak. Please use a stronger password.');  
        } else {
          setError(err.message || 'Registration failed');
        }
      } else {
        setError('Registration failed');
      }
      
      setLoading(false);
      return false;
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Sign in failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Alias for signIn to make API more intuitive
  const login = signIn;

  const loginWithGoogle = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if Google provider is enabled
      if (!isProviderEnabled('google')) {
        setError('Google login is not currently enabled. Please use email/password login.');
        return false;
      }
      
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;
      
      // Save user data to Firestore for new users
      await saveUserData(user);
      
      return true;
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(err instanceof Error ? err.message : 'Google sign in failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (displayName: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) {
        throw new Error('No user logged in');
      }
      
      await updateProfile(user, { displayName });
      
      // Update user data in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName,
        updatedAt: Timestamp.now()
      });
      
      // Force refresh to update UI
      setUser({ ...user });
      
      return true;
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Profile update failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<boolean> => {
    setLoading(true);
    
    try {
      await firebaseSignOut(auth);
      router.push('/login');
      return true;
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err instanceof Error ? err.message : 'Password reset failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Setup recaptcha verifier
  const setupRecaptcha = async (phoneNumber: string): Promise<ConfirmationResult> => {
    try {
      // Clean up any existing recaptcha verifier
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }

      // Create a new invisible recaptcha verifier using the helper function
      const recaptchaVerifier = getRecaptchaVerifier('phone-auth-button');
      
      // Store the verifier globally
      window.recaptchaVerifier = recaptchaVerifier;
      
      // Send verification code to phone number
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier
      );
      
      // Store confirmation result globally
      window.confirmationResult = confirmationResult;
      
      return confirmationResult;
    } catch (err: any) {
      console.error('Error setting up recaptcha or sending code:', err);
      setError(err.message || 'Failed to set up phone verification');
      throw err;
    }
  };

  // Verify phone code
  const verifyPhoneCode = async (code: string, confirmationResult: ConfirmationResult): Promise<boolean> => {
    try {
      // First check if the phone number is already in use
      const phoneNumber = confirmationResult.verificationId ? 
        window.phoneNumber || '' : ''; // Assuming you're storing this in a global variable
      
      if (phoneNumber) {
        const { exists, field } = await checkEmailOrPhoneExists(undefined, phoneNumber);
        if (exists && field) {
          setError(`This phone number is already associated with an account. Please use a different phone number or sign in.`);
          return false;
        }
      }
      
      const userCredential = await confirmationResult.confirm(code);
      
      // Update display name if provided
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: userCredential.user.displayName || ''
        });
      }
      
      // Save user data to Firestore
      if (userCredential.user) {
        // Save user data to Firestore
        const userData: UserData = {
          id: userCredential.user.uid,
          authProvider: 'phone',
          phoneNumber: userCredential.user.phoneNumber || '',
          phoneVerified: true, // Phone is verified through the confirmation process
          displayName: userCredential.user.displayName || '',
          email: userCredential.user.email || '',
          emailVerified: Boolean(userCredential.user.emailVerified), // Fix for emailVerified type issue
          role: 'user',
          subscriptionTier: 'free',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          featuresUsage: {
            qrCodesGenerated: 0,
            barcodesGenerated: 0,
            bulkGenerations: 0,
            aiCustomizations: 0
          },
        };
        await saveUserData(userData);
      }
      
      return true;
    } catch (err: any) {
      console.error('Error verifying code:', err);
      // Handle Firebase auth errors more specifically
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid verification code. Please check and try again.');
      } else if (err.code === 'auth/code-expired') {
        setError('Verification code has expired. Please request a new code.');
      } else {
        setError(err.message || 'Failed to verify code');
      }
      return false;
    }
  };

  // Link phone with current user
  const linkPhoneWithCurrentUser = async (phoneNumber: string, code: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // Implementation for linking phone with current user
      // This would depend on your specific requirements
      
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error linking phone with current user:', error);
      setError(error.message || 'Failed to link phone with current user.');
      setLoading(false);
      return false;
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

  const clearError = () => {
    setError(null);
  };

  // Helper method to check if email is verified
  const isEmailVerified = (): boolean => {
    if (!user) return false;
    
    // If it's a Firebase User object
    if ('emailVerified' in user) {
      return user.emailVerified;
    }
    
    // If it's our UserData type
    return Boolean(user.emailVerified);
  };

  // Delete the current user's account
  const deleteUserAccount = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setError('No user is currently logged in.');
        setLoading(false);
        return false;
      }
      
      // Delete the user document from Firestore
      await deleteDoc(doc(db, 'users', currentUser.uid));
      
      // Delete the user from Firebase Auth
      await deleteUser(currentUser);
      
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error deleting user account:', error);
      setError(error.message || 'Failed to delete user account.');
      setLoading(false);
      return false;
    }
  };

  // Send email verification to the current user
  const sendVerificationEmail = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setError('No user is currently logged in.');
        setLoading(false);
        return false;
      }
      
      await sendEmailVerification(currentUser);
      
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      setError(error.message || 'Failed to send verification email.');
      setLoading(false);
      return false;
    }
  };

  // Link a phone number to an email account
  const linkPhoneWithEmail = async (email: string, phoneNumber: string, code: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // This function would need to be implemented based on your specific requirements
      // It might involve creating a new user with email and then linking the phone,
      // or updating an existing user with phone information
      
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error linking phone with email:', error);
      setError(error.message || 'Failed to link phone with email.');
      setLoading(false);
      return false;
    }
  };

  // Verify email with action code
  const verifyEmail = async (actionCode: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      await applyActionCode(auth, actionCode);
      
      // If user is logged in, update the emailVerified status in Firestore
      if (user && 'uid' in user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          emailVerified: true,
          updatedAt: Timestamp.now()
        });
      }
      
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error verifying email:', error);
      setError(error.message || 'Failed to verify email.');
      setLoading(false);
      return false;
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    error,
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
    verifyPhoneCode,
    linkPhoneWithCurrentUser,
    verifyPhoneLinkCode,
    getIdToken,
    clearError,
    deleteUserAccount,
    sendVerificationEmail,
    linkPhoneWithEmail,
    verifyEmail,
    isEmailVerified
  }), [user, loading, error]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signUp,
        signIn,
        loginWithGoogle,
        logout,
        resetPassword,
        updateUserProfile,
        register,
        setupRecaptcha,
        verifyPhoneCode,
        linkPhoneWithCurrentUser,
        clearError,
        deleteUserAccount,
        sendVerificationEmail,
        linkPhoneWithEmail,
        verifyEmail,
        isEmailVerified
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 