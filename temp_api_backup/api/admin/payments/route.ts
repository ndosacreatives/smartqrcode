import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

// Add no-cache headers to response
const addNoCacheHeaders = (response: NextResponse) => {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  return response;
};

// Get all payments
export async function GET(request: NextRequest) {
  try {
    console.log('Starting to fetch payments from Firestore...');
    
    // Get the collection reference
    const paymentsCollection = adminDb.collection('payments');
    
    // Parse query parameters
    const url = new URL(request.url);
    const days = url.searchParams.get('days');
    const userId = url.searchParams.get('userId');
    const status = url.searchParams.get('status');
    const subscriptionId = url.searchParams.get('subscriptionId');
    
    // Build the query
    let query = paymentsCollection.orderBy('date', 'desc');
    
    // Filter by date range if specified
    if (days && days !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      query = query.where('date', '>=', admin.firestore.Timestamp.fromDate(daysAgo));
    }
    
    // Add additional filters if specified
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    if (subscriptionId) {
      query = query.where('subscriptionId', '==', subscriptionId);
    }
    
    // Execute the query with a reasonable limit
    query = query.limit(100);
    const snapshot = await query.get();
    
    console.log(`Retrieved snapshot with ${snapshot.size} payments`);
    
    // Get user data to map emails to user IDs
    const userIds = new Set<string>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.userId) {
        userIds.add(data.userId);
      }
    });
    
    // Get user data for all unique user IDs
    const userEmails: Record<string, string> = {};
    
    if (userIds.size > 0) {
      const usersArray = Array.from(userIds);
      
      // Split into chunks of 10 (Firestore limitation)
      for (let i = 0; i < usersArray.length; i += 10) {
        const chunk = usersArray.slice(i, i + 10);
        
        const usersSnapshot = await adminDb.collection('users')
          .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
          .get();
        
        usersSnapshot.docs.forEach(doc => {
          const userData = doc.data();
          if (userData.email) {
            userEmails[doc.id] = userData.email;
          }
        });
      }
    }
    
    // Map the documents to a more usable format
    const payments = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Get user email if available
      const userEmail = data.userId ? userEmails[data.userId] : undefined;
      
      return {
        id: doc.id,
        userId: data.userId,
        userEmail,
        amount: data.amount || 0,
        currency: data.currency || 'USD',
        status: data.status || 'pending',
        paymentMethod: data.paymentMethod || 'unknown',
        paymentMethodDetails: data.paymentMethodDetails || {},
        date: data.date ? data.date.toDate().toISOString() : null,
        description: data.description || '',
        metadata: data.metadata || {},
        subscriptionId: data.subscriptionId || undefined
      };
    });
    
    console.log(`Processed ${payments.length} payments`);
    
    // Return the response with cache control headers
    return addNoCacheHeaders(
      NextResponse.json({ payments }, { status: 200 })
    );
  } catch (error) {
    console.error('Error fetching payments:', error);
    
    let errorMessage = 'Failed to fetch payments';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }
    
    return addNoCacheHeaders(
      NextResponse.json({
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    );
  }
}

// Create a new payment record
export async function POST(request: Request) {
  try {
    const { 
      userId, 
      amount, 
      currency, 
      paymentMethod, 
      paymentMethodDetails,
      description, 
      subscriptionId, 
      status,
      metadata 
    } = await request.json();
    
    if (!userId || !amount) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'User ID and amount are required' }, { status: 400 })
      );
    }
    
    // Verify the user exists
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'User not found' }, { status: 404 })
      );
    }
    
    // Create the payment document
    const now = admin.firestore.Timestamp.now();
    const paymentData = {
      userId,
      amount: Number(amount),
      currency: currency || 'USD',
      status: status || 'succeeded',
      paymentMethod: paymentMethod || 'manual',
      paymentMethodDetails: paymentMethodDetails || {},
      date: now,
      description: description || 'Manual payment entry',
      metadata: metadata || {},
      subscriptionId: subscriptionId || null,
      createdAt: now,
      updatedAt: now
    };
    
    // Add the payment to Firestore
    const paymentRef = await adminDb.collection('payments').add(paymentData);
    
    // If this is a subscription payment, update the subscription
    if (subscriptionId) {
      const subscriptionRef = adminDb.collection('subscriptions').doc(subscriptionId);
      const subscriptionDoc = await subscriptionRef.get();
      
      if (subscriptionDoc.exists) {
        // Calculate next billing date (1 month from now)
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        
        await subscriptionRef.update({
          lastPaymentDate: now,
          nextBillingDate: admin.firestore.Timestamp.fromDate(nextBillingDate),
          status: 'active',
          updatedAt: now
        });
      }
    }
    
    return addNoCacheHeaders(
      NextResponse.json({ 
        success: true,
        paymentId: paymentRef.id,
        payment: {
          id: paymentRef.id,
          ...paymentData,
          date: paymentData.date.toDate().toISOString(),
          createdAt: paymentData.createdAt.toDate().toISOString(),
          updatedAt: paymentData.updatedAt.toDate().toISOString()
        }
      }, { status: 201 })
    );
  } catch (error) {
    console.error('Error creating payment:', error);
    
    let errorMessage = 'Failed to create payment';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }
    
    return addNoCacheHeaders(
      NextResponse.json({
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    );
  }
} 