import React from 'react';
import TransactionsTable from '@/components/admin/TransactionsTable';

export default function AdminTransactionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Transactions</h1>
      
      {/* You can add summary stats or filters here later */}
      {/* Example: Total Revenue, Filters by date/status/gateway */}
      
      <div className="mt-8">
        <TransactionsTable />
      </div>
    </div>
  );
} 