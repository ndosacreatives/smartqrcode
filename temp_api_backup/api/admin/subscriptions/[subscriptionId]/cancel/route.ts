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

// Cancel a subscription
export async function POST(
  request: Request,
  { params }: { params: { subscriptionId: string } }
) {
  try {
    console.log(`Attempting to cancel subscription ${params.subscriptionId}`);
    
    const subscriptionId = params.subscriptionId;
    
    // Get the subscription document
    const subscriptionRef = adminDb.collection('subscriptions').doc(subscriptionId);
    const subscriptionDoc = await subscriptionRef.get();
    
    if (!subscriptionDoc.exists) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
      );
    }
    
    const subscriptionData = subscriptionDoc.data() || {};
    
    // Check if the subscription is already canceled
    if (subscriptionData.status === 'canceled') {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Subscription is already canceled' }, { status: 400 })
      );
    }
    
    // Update the subscription status to canceled
    const now = admin.firestore.Timestamp.now();
    await subscriptionRef.update({
      status: 'canceled',
      autoRenew: false,
      updatedAt: now,
      canceledAt: now
    });
    
    // Get the user data to update their subscription tier at the end of the billing period
    const userId = subscriptionData.userId;
    if (userId) {
      // Log the cancellation but don't downgrade the user until the end of their billing period
      console.log(`User ${userId} subscription will be downgraded at end of billing period`);
    }
    
    return addNoCacheHeaders(
      NextResponse.json({ 
        success: true, 
        message: 'Subscription canceled successfully',
        subscription: {
          id: subscriptionId,
          status: 'canceled',
          autoRenew: false,
          canceledAt: now.toDate().toISOString()
        }
      }, { status: 200 })
    );
  } catch (error) {
    console.error('Error canceling subscription:', error);
    
    let errorMessage = 'Failed to cancel subscription';
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