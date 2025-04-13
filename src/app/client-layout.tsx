"use client";

import { useEffect, useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SubscriptionProvider } from "@/context/SubscriptionProvider";
import { FirebaseAuthProvider } from '@/context/FirebaseAuthContext'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <FirebaseAuthProvider>
      <SubscriptionProvider>
        {isMounted ? (
          <>
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer />
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