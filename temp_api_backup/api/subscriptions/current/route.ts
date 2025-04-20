import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { getUserFromRequest } from '@/lib/api-auth';

// Add no-cache headers to response
const addNoCacheHeaders = (response: NextResponse) => {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  return response;
};

// Get the current user's subscription
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }
    
    // Get the user's subscription from Firestore
    const subscriptionsSnapshot = await adminDb.collection('subscriptions')
      .where('userId', '==', user.uid)
      .where('status', 'in', ['active', 'trialing', 'canceled'])
      .orderBy('startDate', 'desc')
      .limit(1)
      .get();
    
    if (subscriptionsSnapshot.empty) {
      // User has no active subscription
      return addNoCacheHeaders(
        NextResponse.json({ 
          subscription: null,
          message: 'No active subscription found'
        }, { status: 200 })
      );
    }
    
    // Get the most recent subscription
    const subscriptionDoc = subscriptionsSnapshot.docs[0];
    const subscriptionData = subscriptionDoc.data();
    
    // Format dates and return
    const subscription = {
      id: subscriptionDoc.id,
      userId: subscriptionData.userId,
      plan: subscriptionData.plan || 'free',
      status: subscriptionData.status || 'inactive',
      startDate: subscriptionData.startDate?.toDate().toISOString() || null,
      endDate: subscriptionData.endDate?.toDate().toISOString() || null,
      autoRenew: subscriptionData.autoRenew || false,
      amount: subscriptionData.amount || 0,
      currency: subscriptionData.currency || 'USD',
      paymentMethod: subscriptionData.paymentMethod || 'unknown',
      lastPaymentDate: subscriptionData.lastPaymentDate?.toDate().toISOString() || null,
      nextBillingDate: subscriptionData.nextBillingDate?.toDate().toISOString() || null,
    };
    
    return addNoCacheHeaders(
      NextResponse.json({ subscription }, { status: 200 })
    );
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    
    let errorMessage = 'Failed to fetch subscription details';
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