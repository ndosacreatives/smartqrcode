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

// Process a payment refund
export async function POST(
  request: Request,
  { params }: { params: { paymentId: string } }
) {
  try {
    console.log(`Attempting to refund payment ${params.paymentId}`);
    
    const paymentId = params.paymentId;
    
    // Get the payment document
    const paymentRef = adminDb.collection('payments').doc(paymentId);
    const paymentDoc = await paymentRef.get();
    
    if (!paymentDoc.exists) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      );
    }
    
    const paymentData = paymentDoc.data() || {};
    
    // Check if the payment is already refunded
    if (paymentData.status === 'refunded') {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Payment is already refunded' }, { status: 400 })
      );
    }
    
    // Check if the payment can be refunded (only succeeded payments can be refunded)
    if (paymentData.status !== 'succeeded') {
      return addNoCacheHeaders(
        NextResponse.json({ error: `Cannot refund payment with status: ${paymentData.status}` }, { status: 400 })
      );
    }
    
    // In a real-world scenario, you would call your payment gateway's API here
    // For example, Stripe has a refund API: stripe.refunds.create({ payment_intent: paymentData.paymentIntentId })
    
    // Update the payment status to refunded
    const now = admin.firestore.Timestamp.now();
    await paymentRef.update({
      status: 'refunded',
      updatedAt: now,
      refundedAt: now
    });
    
    // Create a refund record (optional but recommended for complete tracking)
    const refundData = {
      originalPaymentId: paymentId,
      userId: paymentData.userId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: 'succeeded',
      paymentMethod: paymentData.paymentMethod,
      paymentMethodDetails: paymentData.paymentMethodDetails,
      date: now,
      description: `Refund for payment ${paymentId}`,
      metadata: {
        ...paymentData.metadata,
        refundReason: 'admin_initiated'
      },
      subscriptionId: paymentData.subscriptionId,
      createdAt: now,
      updatedAt: now
    };
    
    const refundRef = await adminDb.collection('refunds').add(refundData);
    
    // If this was a subscription payment, handle subscription logic
    if (paymentData.subscriptionId) {
      const subscriptionRef = adminDb.collection('subscriptions').doc(paymentData.subscriptionId);
      const subscriptionDoc = await subscriptionRef.get();
      
      if (subscriptionDoc.exists) {
        // Add your business logic here for subscription refunds
        // For example, you might want to change the subscription status or end date
        console.log(`Subscription ${paymentData.subscriptionId} payment refunded`);
      }
    }
    
    return addNoCacheHeaders(
      NextResponse.json({ 
        success: true, 
        message: 'Payment refunded successfully',
        payment: {
          id: paymentId,
          status: 'refunded',
          refundedAt: now.toDate().toISOString(),
          refundId: refundRef.id
        }
      }, { status: 200 })
    );
  } catch (error) {
    console.error('Error refunding payment:', error);
    
    let errorMessage = 'Failed to refund payment';
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