"use client";

import { useEffect, useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SubscriptionProvider } from "@/context/SubscriptionProvider";
import { FirebaseAuthProvider } from '@/context/FirebaseAuthContext'
import { usePathname } from 'next/navigation';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <FirebaseAuthProvider>
      <SubscriptionProvider>
        {isMounted ? (
          <>
            {!isAdminPage && <Header />}
            <main className={`flex-grow container mx-auto px-4 py-8 ${isAdminPage ? 'p-0 max-w-none' : ''}`}>
              {children}
            </main>
            {!isAdminPage && <Footer />}
          </>
        ) : (
          <div className="flex-grow container mx-auto px-4 py-8">
            <div className="h-64 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
        )}
      </SubscriptionProvider>
    </FirebaseAuthProvider>
  )
} 