import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

// TODO: Implement proper admin authentication/authorization check
async function isAdmin(request: NextRequest): Promise<boolean> {
  // Replace with your actual authentication logic
  // e.g., check session, token, headers
  console.warn('Admin check not implemented in /api/admin/transactions');
  return true; // Placeholder: Allow all requests for now
}

// Define the Transaction type (should match the frontend type)
interface Transaction {
  id: string;
  date: string;
  customerEmail: string;
  amount: number;
  currency: string;
  gateway: 'Stripe' | 'PayPal' | 'Flutterwave' | 'Other';
  status: 'Completed' | 'Pending' | 'Failed' | 'Refunded';
  description?: string;
}

export async function GET(request: NextRequest) {
  // Optional: Add admin check here
  // if (!await isAdmin(request)) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  // }

  try {
    // TODO: Replace this with actual data fetching logic
    // - Query your database (e.g., Firestore collection 'transactions')
    // - Or fetch from payment gateway APIs (Stripe, PayPal, etc.)
    // const transactions = placeholderTransactions;

    // --- Firestore Fetch Logic with Admin SDK --- 
    const transactionsColRef = adminDb.collection('transactions');
    
    // Example: Get latest 50 transactions, ordered by date descending
    // TODO: Add proper pagination later (using startAfter, endBefore)
    const querySnapshot = await transactionsColRef
      .orderBy('date', 'desc')
      .limit(50)
      .get(); // Admin SDK uses get() without getDocs()
    
    const transactions: Transaction[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Admin Firestore Timestamp to ISO string for frontend compatibility
      const date = data.date instanceof admin.firestore.Timestamp 
        ? data.date.toDate().toISOString() 
        : String(data.date || new Date().toISOString());
      
      return {
        id: doc.id,
        date: date,
        customerEmail: data.customerEmail || 'N/A',
        amount: typeof data.amount === 'number' ? data.amount : 0,
        currency: data.currency || 'USD',
        gateway: data.gateway || 'Other',
        status: data.status || 'Pending',
        description: data.description || ''
      } as Transaction; // Assert type after mapping known fields
    });
    // --- End Firestore Fetch Logic --- 

    // Optional: Add pagination, sorting, filtering based on query parameters
    // const url = new URL(request.url);
    // const page = parseInt(url.searchParams.get('page') || '1');
    // const limit = parseInt(url.searchParams.get('limit') || '10');
    // const sortBy = url.searchParams.get('sortBy') || 'date';
    // const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    // Apply pagination/sorting/filtering to the fetched transactions here

    return NextResponse.json({ transactions }, { status: 200 });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 