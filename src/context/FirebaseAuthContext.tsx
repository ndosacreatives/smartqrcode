"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, displayName?: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updateUserProfile: (data: { displayName?: string, photoURL?: string }) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  clearError: () => void;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => false,
  signUp: async () => false,
  logout: async () => false,
  resetPassword: async () => false,
  updateUserProfile: async () => false,
  signInWithGoogle: async () => false,
  clearError: () => {}
});

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Clear any error
  const clearError = () => setError(null);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    if (!auth) return false;
    
    try {
      clearError();
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName?: string) => {
    if (!auth) return false;
    
    try {
      clearError();
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile if displayName is provided
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }
      
      // Create user document in Firestore
      if (result.user && db) {
        try {
          await setDoc(doc(db, 'users', result.user.uid), {
            email,
            displayName: displayName || '',
            createdAt: serverTimestamp(),
            role: 'user'
          });
        } catch (dbErr: any) {
          console.error('Error creating user document:', dbErr);
          // Continue even if Firestore fails
        }
      }
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Sign out
  const logout = async () => {
    if (!auth) return true;
    
    try {
      clearError();
      await signOut(auth);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    if (!auth) return false;
    
    try {
      clearError();
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Update user profile
  const updateUserProfile = async (data: { displayName?: string, photoURL?: string }) => {
    if (!auth?.currentUser) return false;
    
    try {
      clearError();
      await updateProfile(auth.currentUser, data);
      
      // Update Firestore document if db is available
      if (db) {
        try {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            ...data,
            updatedAt: serverTimestamp()
          });
        } catch (dbErr: any) {
          console.error('Error updating user document:', dbErr);
          // Continue even if Firestore update fails
        }
      }
      
      // Force refresh of user state
      setUser({ ...auth.currentUser });
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    if (!auth) return false;
    
    try {
      clearError();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Create/update user document in Firestore
      if (result.user && db) {
        try {
          const userRef = doc(db, 'users', result.user.uid);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            // New user
            await setDoc(userRef, {
              email: result.user.email,
              displayName: result.user.displayName || '',
              photoURL: result.user.photoURL || '',
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              role: 'user'
            });
          } else {
            // Existing user - update last login
            await updateDoc(userRef, {
              lastLogin: serverTimestamp()
            });
          }
        } catch (dbErr: any) {
          console.error('Error with Firestore during Google sign-in:', dbErr);
          // Continue even if Firestore fails
        }
      }
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Return provider with auth values
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        logout,
        resetPassword,
        updateUserProfile,
        signInWithGoogle,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext); 