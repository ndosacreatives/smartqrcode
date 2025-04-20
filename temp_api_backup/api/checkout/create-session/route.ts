import { NextRequest, NextResponse } from 'next/server';
import { createSubscriptionCheckoutSession, createStripeCustomer } from '@/lib/stripe';
import { createPayPalSubscription } from '@/lib/paypal';
import { createFlutterwaveSubscriptionPayment } from '@/lib/flutterwave';
import { adminDb } from '@/lib/firebase-admin';
import { getUserFromRequest } from '@/lib/api-auth';
import { subscriptionPricing } from '@/lib/subscriptions';
import { getGatewayConfig, PaymentGatewayConfig } from '@/lib/firestore';

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

// Map subscription tiers to PayPal plan IDs
const paypalPlanIds: Record<string, string> = {
  pro: process.env.PAYPAL_PLAN_ID_PRO || '',
  business: process.env.PAYPAL_PLAN_ID_BUSINESS || '',
};

// Payment provider types
type PaymentProvider = 'stripe' | 'paypal' | 'flutterwave';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    // Get payment gateway configuration
    const gatewayConfig = await getGatewayConfig();

    // Get request data
    const { planId, provider = 'stripe', successUrl, cancelUrl } = await request.json();
    
    // Validate required fields
    if (!planId || !successUrl || !cancelUrl) {
      return addNoCacheHeaders(
        NextResponse.json({ 
          error: 'Missing required fields: planId, successUrl, and cancelUrl are required' 
        }, { status: 400 })
      );
    }
    
    // Check if requested provider is enabled
    if (!isProviderEnabled(gatewayConfig, provider as PaymentProvider)) {
      return addNoCacheHeaders(
        NextResponse.json({ 
          error: `Payment provider ${provider} is not currently enabled. Please choose another payment method.` 
        }, { status: 400 })
      );
    }
    
    // Get user email
    const userEmail = user.email || '';
    const userName = user.name || '';
    
    // Get plan amount from subscription pricing
    const amount = subscriptionPricing[planId as keyof typeof subscriptionPricing] || 0;
    
    if (amount === 0) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Invalid plan ID or free plan selected' }, { status: 400 })
      );
    }
    
    // Generate a unique reference for this transaction
    const reference = `sub_${planId}_${user.uid}_${Date.now()}`;
    
    // Handle different payment providers
    switch (provider as PaymentProvider) {
      case 'stripe': {
        // Check if plan exists in Stripe
        if (!stripePriceIds[planId]) {
          return addNoCacheHeaders(
            NextResponse.json({ error: 'Invalid plan ID for Stripe' }, { status: 400 })
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
        
        // Check if in test mode
        const isTestMode = gatewayConfig.stripe.testMode;
        
        // Add test mode information to metadata
        const session = await createSubscriptionCheckoutSession({
          customerId: stripeCustomerId,
          priceId: stripePriceIds[planId],
          successUrl: `${successUrl}?sessionId={CHECKOUT_SESSION_ID}&provider=stripe`,
          cancelUrl,
          metadata: {
            userId: user.uid,
            planId,
            testMode: isTestMode ? 'true' : 'false'
          }
        });
        
        return addNoCacheHeaders(
          NextResponse.json({
            provider: 'stripe',
            sessionId: session.sessionId,
            url: session.url,
            testMode: isTestMode
          }, { status: 200 })
        );
      }
      
      case 'paypal': {
        // Check if plan exists in PayPal
        if (!paypalPlanIds[planId]) {
          return addNoCacheHeaders(
            NextResponse.json({ error: 'Invalid plan ID for PayPal' }, { status: 400 })
          );
        }

        // Check if in test mode
        const isTestMode = gatewayConfig.paypal.testMode;

        // Create PayPal subscription
        const subscription = await createPayPalSubscription({
          planId: paypalPlanIds[planId],
          returnUrl: `${successUrl}?subscriptionId={id}&provider=paypal`,
          cancelUrl,
          customerId: user.uid,
          testMode: isTestMode
        });
        
        return addNoCacheHeaders(
          NextResponse.json({
            provider: 'paypal',
            subscriptionId: subscription.subscriptionId,
            url: subscription.approvalUrl,
            testMode: isTestMode
          }, { status: 200 })
        );
      }
      
      case 'flutterwave': {
        // Check if in test mode
        const isTestMode = gatewayConfig.flutterwave.testMode;

        // Create Flutterwave subscription payment
        const payment = await createFlutterwaveSubscriptionPayment({
          amount,
          customerEmail: userEmail,
          customerName: userName,
          planName: planId.charAt(0).toUpperCase() + planId.slice(1),
          reference,
          redirectUrl: `${successUrl}?reference=${reference}&provider=flutterwave`,
          metadata: {
            userId: user.uid,
            planId,
            testMode: isTestMode ? 'true' : 'false'
          },
          testMode: isTestMode
        });
        
        return addNoCacheHeaders(
          NextResponse.json({
            provider: 'flutterwave',
            reference: payment.reference,
            url: payment.paymentLink,
            testMode: isTestMode
          }, { status: 200 })
        );
      }
      
      default:
        return addNoCacheHeaders(
          NextResponse.json({ error: 'Unsupported payment provider' }, { status: 400 })
        );
    }
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

// Helper function to check if a payment provider is enabled
function isProviderEnabled(config: PaymentGatewayConfig, provider: PaymentProvider): boolean {
  switch (provider) {
    case 'stripe':
      return config.stripe.enabled;
    case 'paypal':
      return config.paypal.enabled;
    case 'flutterwave':
      return config.flutterwave.enabled;
    default:
      return false;
  }
} 