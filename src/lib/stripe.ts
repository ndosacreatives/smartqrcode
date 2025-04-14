import Stripe from 'stripe';

// Initialize Stripe - Get API keys from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '';

// Make sure the secret key is available
if (!stripeSecretKey) {
  console.warn('Missing STRIPE_SECRET_KEY environment variable');
}

// Initialize the Stripe client
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16', // Use the latest API version
});

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
export function verifyStripeWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
) {
  try {
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

// Get public key for client-side use
export function getStripePublicKey() {
  return stripePublicKey;
} 