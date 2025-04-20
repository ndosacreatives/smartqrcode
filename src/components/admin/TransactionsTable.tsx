'use client';

import React, { useState, useEffect } from 'react';

// Define a type for transaction data (adjust based on actual data structure)
interface Transaction {
  id: string;
  date: string; // Or Date object
  customerEmail: string;
  amount: number;
  currency: string;
  gateway: 'Stripe' | 'PayPal' | 'Flutterwave' | 'Other';
  status: 'Completed' | 'Pending' | 'Failed' | 'Refunded';
  description?: string;
}

// Placeholder data
const placeholderTransactions: Transaction[] = [
  { id: 'txn_1', date: '2023-10-26 10:30', customerEmail: 'customer1@example.com', amount: 19.99, currency: 'USD', gateway: 'Stripe', status: 'Completed', description: 'Pro Plan Monthly' },
  { id: 'txn_2', date: '2023-10-25 14:15', customerEmail: 'customer2@example.com', amount: 9.99, currency: 'USD', gateway: 'PayPal', status: 'Completed', description: 'Basic Plan Monthly' },
  { id: 'txn_3', date: '2023-10-25 09:00', customerEmail: 'customer3@example.com', amount: 29.99, currency: 'USD', gateway: 'Stripe', status: 'Failed', description: 'Business Plan Monthly' },
  { id: 'txn_4', date: '2023-10-24 18:00', customerEmail: 'customer1@example.com', amount: 19.99, currency: 'USD', gateway: 'Stripe', status: 'Refunded', description: 'Pro Plan Monthly - Refund' },
  { id: 'txn_5', date: '2023-10-23 11:05', customerEmail: 'customer4@example.com', amount: 99.99, currency: 'USD', gateway: 'Flutterwave', status: 'Pending', description: 'Pro Plan Yearly' },
];

export default function TransactionsTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Fetch actual transaction data
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        // Replace with actual API call to fetch transactions
        const response = await fetch('/api/admin/transactions');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch transactions');
        }
        const data = await response.json();
        setTransactions(data.transactions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading transactions...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-600">Error loading transactions: {error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Transactions</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gateway</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              {/* Add more columns if needed, e.g., Transaction ID */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No transactions found.</td>
              </tr>
            )}
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.customerEmail}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.amount.toFixed(2)} {tx.currency}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.gateway}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={tx.description}>{tx.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* TODO: Add pagination if there are many transactions */}
    </div>
  );
} 