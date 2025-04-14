import { NextRequest, NextResponse } from 'next/server';
import { stripe, verifyStripeWebhookSignature } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    // Get the webhook signature from the headers
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 });
    }
    
    // Get the webhook secret from environment variables
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
      return new Response('Webhook secret not configured', { status: 500 });
    }
    
    // Get the raw body for verification
    const body = await request.text();
    
    // Verify the webhook signature
    const event = verifyStripeWebhookSignature(
      body,
      signature,
      webhookSecret
    );
    
    // Handle the event based on its type
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract user ID and plan from metadata
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        
        if (!userId || !planId) {
          console.error('Missing userId or planId in session metadata');
          return new Response('Missing metadata', { status: 400 });
        }
        
        // Get the Stripe subscription ID
        const subscriptionId = session.subscription as string;
        
        if (!subscriptionId) {
          console.error('Missing subscription ID in checkout session');
          return new Response('Missing subscription ID', { status: 400 });
        }
        
        // Get the subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Calculate end date based on current period end
        const endDate = new Date(subscription.current_period_end * 1000);
        
        // Create or update subscription in Firestore
        const now = admin.firestore.Timestamp.now();
        const subscriptionData = {
          userId,
          plan: planId,
          status: subscription.status,
          startDate: admin.firestore.Timestamp.fromDate(new Date(subscription.start_date * 1000)),
          endDate: admin.firestore.Timestamp.fromDate(endDate),
          autoRenew: true,
          amount: (subscription.items.data[0].price.unit_amount || 0) / 100, // Convert from cents
          currency: subscription.currency.toUpperCase(),
          paymentMethod: 'stripe',
          lastPaymentDate: now,
          nextBillingDate: admin.firestore.Timestamp.fromDate(endDate),
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          createdAt: now,
          updatedAt: now
        };
        
        // Add the subscription to Firestore
        const subscriptionRef = await adminDb.collection('subscriptions').add(subscriptionData);
        
        // Update the user document with the new subscription tier
        await adminDb.collection('users').doc(userId).update({
          subscriptionTier: planId,
          updatedAt: now
        });
        
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (!subscriptionId) {
          console.error('Missing subscription ID in invoice');
          return new Response('Missing subscription ID', { status: 400 });
        }
        
        // Find the subscription in Firestore
        const subscriptionsSnapshot = await adminDb.collection('subscriptions')
          .where('stripeSubscriptionId', '==', subscriptionId)
          .limit(1)
          .get();
        
        if (subscriptionsSnapshot.empty) {
          console.error(`No subscription found with Stripe ID: ${subscriptionId}`);
          return new Response('Subscription not found', { status: 404 });
        }
        
        const subscriptionDoc = subscriptionsSnapshot.docs[0];
        const subscriptionData = subscriptionDoc.data();
        
        // Get the subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Calculate next billing date based on current period end
        const nextBillingDate = new Date(subscription.current_period_end * 1000);
        
        // Update the subscription in Firestore
        const now = admin.firestore.Timestamp.now();
        await subscriptionDoc.ref.update({
          status: 'active',
          lastPaymentDate: now,
          nextBillingDate: admin.firestore.Timestamp.fromDate(nextBillingDate),
          updatedAt: now
        });
        
        // Create a payment record
        await adminDb.collection('payments').add({
          userId: subscriptionData.userId,
          amount: (invoice.amount_paid || 0) / 100, // Convert from cents
          currency: invoice.currency.toUpperCase(),
          status: 'succeeded',
          paymentMethod: 'stripe',
          paymentMethodDetails: {
            type: 'card',
            gateway: 'stripe',
          },
          date: now,
          description: `Payment for ${subscriptionData.plan} subscription`,
          subscriptionId: subscriptionDoc.id,
          stripeInvoiceId: invoice.id,
          createdAt: now,
          updatedAt: now
        });
        
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find the subscription in Firestore
        const subscriptionsSnapshot = await adminDb.collection('subscriptions')
          .where('stripeSubscriptionId', '==', subscription.id)
          .limit(1)
          .get();
        
        if (subscriptionsSnapshot.empty) {
          console.error(`No subscription found with Stripe ID: ${subscription.id}`);
          return new Response('Subscription not found', { status: 404 });
        }
        
        const subscriptionDoc = subscriptionsSnapshot.docs[0];
        
        // Update the subscription status
        const now = admin.firestore.Timestamp.now();
        await subscriptionDoc.ref.update({
          status: subscription.status,
          autoRenew: !subscription.cancel_at_period_end,
          updatedAt: now
        });
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find the subscription in Firestore
        const subscriptionsSnapshot = await adminDb.collection('subscriptions')
          .where('stripeSubscriptionId', '==', subscription.id)
          .limit(1)
          .get();
        
        if (subscriptionsSnapshot.empty) {
          console.error(`No subscription found with Stripe ID: ${subscription.id}`);
          return new Response('Subscription not found', { status: 404 });
        }
        
        const subscriptionDoc = subscriptionsSnapshot.docs[0];
        const subscriptionData = subscriptionDoc.data();
        
        // Update the subscription status
        const now = admin.firestore.Timestamp.now();
        await subscriptionDoc.ref.update({
          status: 'canceled',
          autoRenew: false,
          updatedAt: now,
          canceledAt: now
        });
        
        // Downgrade user to free tier
        await adminDb.collection('users').doc(subscriptionData.userId).update({
          subscriptionTier: 'free',
          updatedAt: now
        });
        
        break;
      }
      
      // Add more event types as needed
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Error processing webhook' }),
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 