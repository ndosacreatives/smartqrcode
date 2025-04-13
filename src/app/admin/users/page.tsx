"use client";

import React, { useState, useEffect } from "react";
// import { updateUserData } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import CreateUserModal from '@/components/admin/CreateUserModal';
import { getSubscriptionDetails, SubscriptionTier } from '@/lib/subscriptions';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<DocumentData | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleEdit = (user: DocumentData) => {
    setEditingUserId(user.id);
    setEditingUser({ ...user });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingUser(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingUser((prev: DocumentData | null) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!editingUser) return;
    try {
      const userDocRef = doc(db, "users", editingUser.id);
      // Prepare data, excluding id
      const { id, ...dataToUpdate } = editingUser;
      await updateDoc(userDocRef, dataToUpdate);
      // Update local state
      setUsers(users.map(u => u.id === id ? editingUser : u));
      handleCancelEdit();
      alert("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user.");
    }
  };

  const handleCreateUser = async (userData: Partial<DocumentData> & { password?: string }) => {
    // Remove password from userData before typescript complains
    const { password, ...userDataWithoutPassword } = userData;
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userDataWithoutPassword,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const data = await response.json();
      
      // Add the new user to the state
      setUsers([...users, data.user]);
      
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      // Use the API endpoint instead of direct Firestore access
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }
      
      // Update local state for immediate UI feedback
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert("User role updated successfully!"); 
    } catch (err) {
      console.error("Error updating user role:", err);
      alert("Failed to update user role.");
    }
  };

  const handleSubscriptionChange = async (userId: string, newTier: string) => {
    try {
      // Use the API endpoint instead of direct Firestore access
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionTier: newTier }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscription tier');
      }

      // Update local state for immediate UI feedback
      setUsers(users.map(u => u.id === userId ? { ...u, subscriptionTier: newTier } : u));
      alert("Subscription tier updated successfully!");
    } catch (err) {
      console.error("Error updating subscription tier:", err);
      alert("Failed to update subscription tier.");
    }
  };

  // Add delete user function
  const handleDeleteUser = async (userId: string, email: string) => {
    // Ask for confirmation before deleting
    if (!confirm(`Are you sure you want to delete user with email: ${email}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      // Remove the user from the state
      setUsers(users.filter(u => u.id !== userId));
      alert('User deleted successfully!');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user.');
    }
  };

  // Helper function to format Timestamp
  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return "N/A";
    // Convert Firebase Timestamp to JavaScript Date object
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US");
  };

  // Add this new function
  const renderFeaturesList = (tier: SubscriptionTier) => {
    const details = getSubscriptionDetails(tier);
    const features = details.features;
    
    return (
      <div className="mt-2 text-xs">
        <div className="font-bold mb-1">{details.name} Plan - ${details.price}/month</div>
        <ul className="list-disc pl-4 space-y-1">
          <li>QR Codes: {features.maxQRCodes}</li>
          <li>Barcodes: {features.maxBarcodes}</li>
          <li>Bulk Generation: {features.bulkGenerationAllowed ? `Yes (max ${features.maxBulkItems})` : 'No'}</li>
          <li>AI Customization: {features.aiCustomizationAllowed ? `Yes (max ${features.maxAICustomizations})` : 'No'}</li>
          <li>Analytics: {features.analyticsEnabled ? 'Yes' : 'No'}</li>
          <li>Custom Branding: {features.customBrandingAllowed ? 'Yes' : 'No'}</li>
          <li>Team Access: {features.teamMembersAllowed ? `Yes (max ${features.maxTeamMembers})` : 'No'}</li>
        </ul>
      </div>
    );
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="ml-4">Loading users...</p>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              const fetchUsers = async () => {
                setLoading(true);
                try {
                  const usersCollection = collection(db, "users");
                  const usersSnapshot = await getDocs(usersCollection);
                  const usersList = usersSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                  }));
                  setUsers(usersList);
                } catch (error) {
                  console.error("Error fetching users:", error);
                } finally {
                  setLoading(false);
                }
              };

              fetchUsers();
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
          <p>No users found. Add a user to get started.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  {editingUserId === user.id && editingUser ? (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" colSpan={5}>
                        <div className="space-y-2">
                          <div>ID: {user.id}</div>
                          <input type="email" name="email" value={editingUser.email} onChange={handleInputChange} className="w-full p-1 border rounded" />
                          <input type="text" name="displayName" value={editingUser.displayName} onChange={handleInputChange} className="w-full p-1 border rounded" />
                          <select name="subscriptionTier" value={editingUser.subscriptionTier} onChange={handleInputChange} className="w-full p-1 border rounded">
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="business">Business</option>
                          </select>
                          <select name="role" value={editingUser.role} onChange={handleInputChange} className="w-full p-1 border rounded">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button onClick={handleSaveChanges} className="text-green-600 hover:text-green-900 mr-2">Save</button>
                        <button onClick={handleCancelEdit} className="text-gray-600 hover:text-gray-900">Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.displayName || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <select 
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="relative group">
                          <select 
                            value={user.subscriptionTier}
                            onChange={(e) => handleSubscriptionChange(user.id, e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="business">Business</option>
                          </select>
                          <div className="hidden group-hover:block absolute z-10 bg-white p-3 shadow-lg rounded-md border border-gray-200 min-w-[300px] right-0 mt-1">
                            <div className="text-sm font-medium mb-2">Current Plan: {user.subscriptionTier}</div>
                            <div className="border-t pt-2">
                              <div className="mb-3">
                                <div className="font-bold">Free Plan Features:</div>
                                {renderFeaturesList('free')}
                              </div>
                              <div className="mb-3">
                                <div className="font-bold">Pro Plan Features:</div>
                                {renderFeaturesList('pro')}
                              </div>
                              <div>
                                <div className="font-bold">Business Plan Features:</div>
                                {renderFeaturesList('business')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleEdit(user)}
                          className="text-indigo-600 hover:text-indigo-900 mr-2"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Creation Modal */}
      <CreateUserModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateUser}
      />
    </div>
  );
} 