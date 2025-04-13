import React from 'react';
// Remove unused imports related to auth/redirect
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { useAuth } from '@/context/FirebaseAuthContext';
// import { getUserData } from '@/lib/firestore';
import AdminRootWrapper from '@/components/admin/AdminRootWrapper';
// Import the correct provider component
// import { FirebaseAuthProvider } from '@/context/FirebaseAuthContext';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Smart QR Code Generator',
  description: 'Admin panel for managing Smart QR Code Generator',
};

// This is a standalone layout that doesn't inherit the main site header
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AdminRootWrapper>
          {children}
        </AdminRootWrapper>
      </body>
    </html>
  );
} 