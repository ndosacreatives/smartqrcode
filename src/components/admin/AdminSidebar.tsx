"use client"; // Make this a client component for the logout button interaction

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();
  
  // Function to determine active state for navigation items
  const isActive = (path: string) => {
    return pathname?.startsWith(path) 
      ? "bg-gray-900 text-white" 
      : "text-gray-300 hover:bg-gray-700 hover:text-white";
  };

  return (
    <aside className="w-64 bg-gray-800 text-white sticky top-0 h-screen flex flex-col">
      {/* Site Name and Logo */}
      <div className="px-4 py-5 flex items-center border-b border-gray-700">
        <svg 
          className="h-8 w-8 text-indigo-500" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor"
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <rect x="7" y="7" width="3" height="3"></rect>
          <rect x="14" y="7" width="3" height="3"></rect>
          <rect x="7" y="14" width="3" height="3"></rect>
          <rect x="14" y="14" width="3" height="3"></rect>
        </svg>
        <span className="ml-3 text-xl font-semibold">SmartQR Admin</span>
      </div>

      {/* Navigation Section - scrollable area */}
      <div className="flex-grow overflow-y-auto">
        <nav className="mt-5 px-3 space-y-1">
          <Link 
            href="/admin" 
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              pathname === '/admin' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <svg 
              className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>

          <Link 
            href="/admin/users" 
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/admin/users')}`}
          >
            <svg 
              className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            User Management
          </Link>

          <Link 
            href="/admin/subscriptions" 
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/admin/subscriptions')}`}
          >
            <svg 
              className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            Subscriptions
          </Link>

          <Link 
            href="/admin/payments" 
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/admin/payments')}`}
          >
            <svg 
              className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            Payments
          </Link>

          <Link 
            href="/admin/transactions" 
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/admin/transactions')}`}
          >
            <svg 
              className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Transactions
          </Link>

          <Link 
            href="/admin/settings" 
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/admin/settings')}`}
          >
            <svg 
              className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>

          <Link 
            href="/admin/credentials" 
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive('/admin/credentials')}`}
          >
            <svg 
              className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            API Credentials
          </Link>
        </nav>
      </div>
      
      {/* Additional links at the bottom */}
      <div className="px-3 pt-4 pb-4 border-t border-gray-700">
        <Link 
          href="/" 
          className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <svg 
            className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back to Main Site
        </Link>
      </div>
    </aside>
  );
} 