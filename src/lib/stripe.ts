import Stripe from 'stripe';
import { getCredential } from '@/lib/credentials';

// Create a singleton instance for direct import
let stripeInstance: Stripe | null = null;

// Initialize Stripe with credential from either environment or encrypted storage
export async function getStripeClient() {
  const stripeSecretKey = await getCredential('STRIPE_SECRET_KEY');
  
  if (!stripeSecretKey) {
    console.warn('Missing STRIPE_SECRET_KEY');
    throw new Error('Stripe API key not configured');
  }
  
  const instance = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
  });
  
  // Update the singleton instance
  stripeInstance = instance;
  
  return instance;
}

// Export the stripe instance directly for backward compatibility
// Note: This will be null until getStripeClient() is called once
export const stripe = stripeInstance;

// Get public key for client-side use
export async function getStripePublicKey() {
  return await getCredential('NEXT_PUBLIC_STRIPE_PUBLIC_KEY');
}

// Create a checkout session for subscription
export async function createSubscriptionCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  customerId?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  try {
    const stripe = await getStripeClient();
    
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    };

    // Use customer ID if provided, otherwise a new customer will be created
    if (customerId) {
      params.customer = customerId;
    } else {
      params.customer_creation = 'always';
    }

    const session = await stripe.checkout.sessions.create(params);
    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

// Create a Stripe customer
export async function createStripeCustomer({
  email,
  name,
  metadata = {},
}: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  try {
    const stripe = await getStripeClient();
    
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });

    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw new Error('Failed to create Stripe customer');
  }
}

// Cancel a subscription in Stripe
export async function cancelStripeSubscription(subscriptionId: string) {
  try {
    const stripe = await getStripeClient();
    
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return subscription;
  } catch (error) {
    console.error('Error canceling Stripe subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

// Helper function to verify webhook signature
export async function verifyStripeWebhookSignature(
  payload: string | Buffer,
  signature: string
) {
  try {
    const stripe = await getStripeClient();
    const webhookSecret = await getCredential('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }
    
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    throw new Error('Failed to verify webhook signature');
  }
} 