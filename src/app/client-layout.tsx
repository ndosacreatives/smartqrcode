"use client";

import { useEffect, useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { FirebaseAuthProvider } from '@/context/FirebaseAuthContext'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use this state to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Return null or a simple loading state during SSR to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="h-16 bg-white shadow-sm"></div>
        <main className="flex-grow container mx-auto px-4 py-8">
          {/* Render children during SSR for SEO, but don't wrap with client components */}
          {children}
        </main>
        <div className="h-12 bg-gray-100"></div>
      </div>
    );
  }

  return (
    <>
      <FirebaseAuthProvider>
        <SubscriptionProvider>
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
        </SubscriptionProvider>
      </FirebaseAuthProvider>
    </>
  )
} 