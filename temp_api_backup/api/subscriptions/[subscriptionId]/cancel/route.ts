import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getUserFromRequest } from '@/lib/api-auth';
import { cancelStripeSubscription } from '@/lib/stripe';
import { cancelPayPalSubscription } from '@/lib/paypal';
import { cancelFlutterwaveSubscription } from '@/lib/flutterwave';
import { logger } from '@/lib/logger';

// Helper function to add no-cache headers
function addNoCacheHeaders(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { subscriptionId: string } }
) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return addNoCacheHeaders(
        NextResponse.json(
          { error: 'Unauthorized. You must be logged in to cancel a subscription.' },
          { status: 401 }
        )
      );
    }

    // Get subscription ID from params
    const { subscriptionId } = params;
    if (!subscriptionId) {
      return addNoCacheHeaders(
        NextResponse.json(
          { error: 'Subscription ID is required' },
          { status: 400 }
        )
      );
    }

    // Get the subscription from Firestore
    const subscriptionRef = adminDb.collection('subscriptions').doc(subscriptionId);
    const subscriptionSnapshot = await subscriptionRef.get();

    if (!subscriptionSnapshot.exists) {
      return addNoCacheHeaders(
        NextResponse.json(
          { error: 'Subscription not found' },
          { status: 404 }
        )
      );
    }

    const subscription = subscriptionSnapshot.data();
    
    // Check if the subscription belongs to the user
    if (subscription?.userId !== user.uid) {
      return addNoCacheHeaders(
        NextResponse.json(
          { error: 'You do not have permission to cancel this subscription' },
          { status: 403 }
        )
      );
    }

    // Check if subscription is already canceled
    if (subscription.status === 'canceled') {
      return addNoCacheHeaders(
        NextResponse.json(
          { error: 'Subscription is already canceled' },
          { status: 400 }
        )
      );
    }

    // Get cancellation reason from request body
    const { reason } = await request.json();
    const cancellationReason = reason || 'Canceled by user';

    // Cancel subscription based on provider
    try {
      switch (subscription.provider) {
        case 'stripe':
          await cancelStripeSubscription(subscription.providerSubscriptionId);
          break;
        case 'paypal':
          await cancelPayPalSubscription(
            subscription.providerSubscriptionId,
            cancellationReason
          );
          break;
        case 'flutterwave':
          await cancelFlutterwaveSubscription(
            subscription.userId,
            subscription.providerSubscriptionId
          );
          break;
        default:
          return addNoCacheHeaders(
            NextResponse.json({ error: 'Unsupported payment provider' }, { status: 400 })
          );
      }
    } catch (providerError: any) {
      logger.error('Failed to cancel subscription with provider', {
        subscriptionId,
        provider: subscription.provider,
        error: providerError.message
      });
      
      return addNoCacheHeaders(
        NextResponse.json(
          { error: `Failed to cancel subscription with ${subscription.provider}`, message: providerError.message },
          { status: 500 }
        )
      );
    }

    // Update subscription status in Firestore
    await subscriptionRef.update({
      status: 'canceled',
      canceledAt: new Date(),
      updatedAt: new Date(),
      cancellationReason
    });

    return addNoCacheHeaders(
      NextResponse.json({
        success: true,
        message: 'Subscription canceled successfully',
        subscription: {
          id: subscriptionId,
          ...subscription,
          status: 'canceled',
          canceledAt: new Date(),
          updatedAt: new Date(),
          cancellationReason
        }
      })
    );
  } catch (error: any) {
    logger.error('Error canceling subscription', { error });
    
    return addNoCacheHeaders(
      NextResponse.json(
        { error: 'Failed to cancel subscription', message: error.message },
        { status: 500 }
      )
    );
  }
} 