"use client"; // Make this a client component for the logout button interaction

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/FirebaseAuthContext'; // Import Firebase useAuth

export default function AdminSidebar() {
  const router = useRouter();
  const { logout } = useAuth(); // Get logout function from Firebase context

  const handleLogout = async () => {
    try {
      await logout(); // Call Firebase logout
      // Redirect to home or login after Firebase logout
      router.push('/'); 
      // No need to manually refresh, auth state change should handle it
    } catch (error) {
      console.error("Admin logout error (Firebase):", error);
      alert('An error occurred during logout.');
    }
  };

  return (
    <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col min-h-screen">
      <h2 className="text-xl font-semibold mb-6">Admin Panel</h2>
      <nav className="flex-grow">
        <ul>
          <li className="mb-2"><Link href="/admin" className="hover:bg-gray-700 p-2 rounded block">Dashboard</Link></li>
          <li className="mb-2"><Link href="/admin/users" className="hover:bg-gray-700 p-2 rounded block">User Management</Link></li>
          {/* <li className="mb-2"><Link href="/admin/settings" className="hover:bg-gray-700 p-2 rounded block">Settings</Link></li> */}
          {/* <li className="mb-2"><Link href="/admin/integrations" className="hover:bg-gray-700 p-2 rounded block">API Integrations</Link></li> */}
        </ul>
      </nav>
      <div className="mt-auto">
        <Link href="/" className="hover:bg-gray-700 p-2 rounded block text-sm mb-2">Back to Main Site</Link>
        <button 
          onClick={handleLogout}
          className="w-full text-left hover:bg-red-700 bg-red-600 p-2 rounded block text-sm"
        >
          Logout
        </button>
      </div>
    </aside>
  );
} 