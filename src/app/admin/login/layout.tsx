import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login - Smart QR Code Generator',
  description: 'Login to access the admin panel for Smart QR Code Generator',
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This is a standalone layout that doesn't use AdminLayout to avoid requiring auth
  return (
    <div className="w-full min-h-screen max-w-none p-0 m-0">
      {children}
    </div>
  );
} 