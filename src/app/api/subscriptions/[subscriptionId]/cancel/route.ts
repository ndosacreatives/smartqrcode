import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { getUserFromRequest } from '@/lib/api-auth';

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
  request: NextRequest,
  { params }: { params: { subscriptionId: string } }
) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }
    
    // Get the subscription ID from the path
    const subscriptionId = params.subscriptionId;
    if (!subscriptionId) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 })
      );
    }
    
    // Get the subscription document
    const subscriptionRef = adminDb.collection('subscriptions').doc(subscriptionId);
    const subscriptionDoc = await subscriptionRef.get();
    
    if (!subscriptionDoc.exists) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
      );
    }
    
    const subscriptionData = subscriptionDoc.data();
    
    // Ensure the subscription belongs to the authenticated user
    if (subscriptionData?.userId !== user.uid) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'You are not authorized to cancel this subscription' }, { status: 403 })
      );
    }
    
    // Check if the subscription is already canceled
    if (subscriptionData?.status === 'canceled') {
      return addNoCacheHeaders(
        NextResponse.json({ 
          error: 'Subscription is already canceled',
          subscription: {
            id: subscriptionId,
            status: 'canceled',
            autoRenew: false
          }
        }, { status: 400 })
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
    
    // In a real system, you might need to call a payment provider API here
    // to cancel the subscription at the payment processor
    
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