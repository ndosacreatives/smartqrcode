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

// Get all subscriptions
export async function GET(request: NextRequest) {
  try {
    console.log('Starting to fetch subscriptions from Firestore...');
    
    // Get the collection reference
    const subscriptionsCollection = adminDb.collection('subscriptions');
    
    // Parse query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const userId = url.searchParams.get('userId');
    
    // Build the query
    let query = subscriptionsCollection.orderBy('startDate', 'desc');
    
    // Add filters if specified
    if (status) {
      query = query.where('status', '==', status);
    }
    
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    
    // Execute the query
    const snapshot = await query.get();
    
    console.log(`Retrieved snapshot with ${snapshot.size} subscriptions`);
    
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
      const usersSnapshot = await adminDb.collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', Array.from(userIds))
        .get();
      
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        if (userData.email) {
          userEmails[doc.id] = userData.email;
        }
      });
    }
    
    // Map the documents to a more usable format
    const subscriptions = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Get user email if available
      const userEmail = data.userId ? userEmails[data.userId] : undefined;
      
      return {
        id: doc.id,
        userId: data.userId,
        userEmail,
        plan: data.plan || 'free',
        status: data.status || 'inactive',
        startDate: data.startDate ? data.startDate.toDate().toISOString() : null,
        endDate: data.endDate ? data.endDate.toDate().toISOString() : null,
        autoRenew: data.autoRenew || false,
        amount: data.amount || 0,
        currency: data.currency || 'USD',
        paymentMethod: data.paymentMethod || 'unknown',
        lastPaymentDate: data.lastPaymentDate ? data.lastPaymentDate.toDate().toISOString() : null,
        nextBillingDate: data.nextBillingDate ? data.nextBillingDate.toDate().toISOString() : null,
      };
    });
    
    console.log(`Processed ${subscriptions.length} subscriptions`);
    
    // Return the response with cache control headers
    return addNoCacheHeaders(
      NextResponse.json({ subscriptions }, { status: 200 })
    );
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    
    let errorMessage = 'Failed to fetch subscriptions';
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

// Create a new subscription
export async function POST(request: Request) {
  try {
    const { userId, plan, amount, currency, paymentMethod, autoRenew } = await request.json();
    
    if (!userId || !plan || !amount) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'User ID, plan, and amount are required' }, { status: 400 })
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
    
    // Calculate subscription end date (default 1 month from now)
    const now = admin.firestore.Timestamp.now();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    // Create the subscription document
    const subscriptionData = {
      userId,
      plan,
      status: 'active',
      startDate: now,
      endDate: admin.firestore.Timestamp.fromDate(endDate),
      autoRenew: autoRenew ?? true,
      amount: Number(amount),
      currency: currency || 'USD',
      paymentMethod: paymentMethod || 'manual',
      lastPaymentDate: now,
      nextBillingDate: admin.firestore.Timestamp.fromDate(endDate),
      createdAt: now,
      updatedAt: now
    };
    
    // Add the subscription to Firestore
    const subscriptionRef = await adminDb.collection('subscriptions').add(subscriptionData);
    
    // Also update the user document with the new subscription tier
    await userRef.update({
      subscriptionTier: plan,
      updatedAt: now
    });
    
    return addNoCacheHeaders(
      NextResponse.json({ 
        success: true,
        subscriptionId: subscriptionRef.id,
        subscription: {
          id: subscriptionRef.id,
          ...subscriptionData,
          startDate: subscriptionData.startDate.toDate().toISOString(),
          endDate: subscriptionData.endDate.toDate().toISOString(),
          lastPaymentDate: subscriptionData.lastPaymentDate.toDate().toISOString(),
          nextBillingDate: subscriptionData.nextBillingDate.toDate().toISOString(),
          createdAt: subscriptionData.createdAt.toDate().toISOString(),
          updatedAt: subscriptionData.updatedAt.toDate().toISOString()
        }
      }, { status: 201 })
    );
  } catch (error) {
    console.error('Error creating subscription:', error);
    
    let errorMessage = 'Failed to create subscription';
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