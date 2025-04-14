import { NextRequest, NextResponse } from 'next/server';
import { createSubscriptionCheckoutSession, createStripeCustomer } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { getUserFromRequest } from '@/lib/api-auth';
import { subscriptionPricing } from '@/lib/subscriptions';

// Add no-cache headers to response
const addNoCacheHeaders = (response: NextResponse) => {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  return response;
};

// Map subscription tiers to Stripe price IDs
const stripePriceIds: Record<string, string> = {
  pro: process.env.STRIPE_PRICE_ID_PRO || '',
  business: process.env.STRIPE_PRICE_ID_BUSINESS || '',
};

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    // Get request data
    const { planId, successUrl, cancelUrl } = await request.json();
    
    // Validate required fields
    if (!planId || !successUrl || !cancelUrl) {
      return addNoCacheHeaders(
        NextResponse.json({ 
          error: 'Missing required fields: planId, successUrl, and cancelUrl are required' 
        }, { status: 400 })
      );
    }
    
    // Check if plan exists
    if (!stripePriceIds[planId]) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
      );
    }

    // Get Stripe customer ID or create one
    let stripeCustomerId: string | undefined;
    
    // Check if user has Stripe customer ID in Firestore
    const userDoc = await adminDb.collection('users').doc(user.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      stripeCustomerId = userData?.stripeCustomerId;
    }
    
    // Create Stripe customer if not exists
    if (!stripeCustomerId) {
      const userEmail = user.email || '';
      const userName = user.name || '';
      
      const stripeCustomer = await createStripeCustomer({
        email: userEmail,
        name: userName,
        metadata: {
          userId: user.uid
        }
      });
      
      stripeCustomerId = stripeCustomer.id;
      
      // Update user with Stripe customer ID
      await adminDb.collection('users').doc(user.uid).update({
        stripeCustomerId,
        updatedAt: new Date()
      });
    }
    
    // Create checkout session
    const session = await createSubscriptionCheckoutSession({
      customerId: stripeCustomerId,
      priceId: stripePriceIds[planId],
      successUrl: `${successUrl}?sessionId={CHECKOUT_SESSION_ID}`,
      cancelUrl,
      metadata: {
        userId: user.uid,
        planId
      }
    });
    
    return addNoCacheHeaders(
      NextResponse.json({
        sessionId: session.sessionId,
        url: session.url
      }, { status: 200 })
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    let errorMessage = 'Failed to create checkout session';
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