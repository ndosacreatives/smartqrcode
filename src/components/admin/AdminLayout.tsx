'use client';

import React from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import { FirebaseAuthProvider } from '@/context/FirebaseAuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <FirebaseAuthProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header at the top */}
        <AdminHeader />
        
        {/* Main content area with sidebar */}
        <div className="flex flex-1 h-[calc(100vh-4rem)]">
          {/* Sidebar - hidden on mobile */}
          <div className="hidden sm:block sm:w-64 flex-shrink-0 bg-gray-800">
            <AdminSidebar />
          </div>
          
          {/* Main content - scrollable */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </FirebaseAuthProvider>
  );
} 