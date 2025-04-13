'use client';

import React from 'react';
import { FirebaseAuthProvider } from '@/context/FirebaseAuthContext';
import AdminLayout from './AdminLayout';

interface AdminRootWrapperProps {
  children: React.ReactNode;
}

export default function AdminRootWrapper({ children }: AdminRootWrapperProps) {
  return (
    <FirebaseAuthProvider>
      <AdminLayout>{children}</AdminLayout>
    </FirebaseAuthProvider>
  );
} 