"use client";

import React from 'react';
// Remove unused imports related to auth/redirect
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { useAuth } from '@/context/FirebaseAuthContext';
// import { getUserData } from '@/lib/firestore';
import AdminSidebar from '@/components/admin/AdminSidebar'; // Use the existing sidebar component

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // REMOVED ALL AUTHENTICATION AND ROLE CHECKING LOGIC
  
  // Directly render the admin layout structure
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 bg-gray-100">
        {children}
      </main>
    </div>
  );
} 