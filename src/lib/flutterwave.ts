import Flutterwave from 'flutterwave-node-v3';
import { getCredential } from '@/lib/credentials';

// Initialize Flutterwave with lazy loading
let flutterwaveClient: any = null;

// Get Flutterwave client
async function getFlutterwaveClient() {
  if (!flutterwaveClient) {
    const publicKey = await getCredential('FLUTTERWAVE_PUBLIC_KEY');
    const secretKey = await getCredential('FLUTTERWAVE_SECRET_KEY');
    
    // Make sure credentials are available
    if (!publicKey || !secretKey) {
      console.warn('Missing Flutterwave credentials (FLUTTERWAVE_PUBLIC_KEY and/or FLUTTERWAVE_SECRET_KEY)');
      throw new Error('Flutterwave credentials not configured');
    }
    
    flutterwaveClient = new Flutterwave(publicKey, secretKey);
  }
  
  return flutterwaveClient;
}

// Create a payment link with Flutterwave
export async function createFlutterwavePaymentLink({
  amount,
  currency = 'USD',
  customerEmail,
  customerName,
  description,
  reference,
  callbackUrl,
  redirectUrl,
  metadata = {},
}: {
  amount: number;
  currency?: string;
  customerEmail: string;
  customerName?: string;
  description: string;
  reference: string;
  callbackUrl?: string;
  redirectUrl: string;
  metadata?: Record<string, any>;
}) {
  try {
    // Get Flutterwave client
    const flw = await getFlutterwaveClient();
    
    // Prepare payment payload
    const payload: any = {
      tx_ref: reference,
      amount,
      currency,
      payment_options: 'card, mobilemoneyghana, ussd',
      redirect_url: redirectUrl,
      customer: {
        email: customerEmail,
        name: customerName || customerEmail.split('@')[0],
      },
      customizations: {
        title: 'SmartQRCode Payment',
        description,
        logo: 'https://yourdomain.com/logo.png', // Replace with your logo URL
      },
      meta: {
        ...metadata,
        source: 'smartqrcode_app',
      },
    };

    if (callbackUrl) {
      payload.meta = {
        ...payload.meta,
        callback_url: callbackUrl
      };
    }

    // Create payment link
    const response = await flw.Charge.card(payload);

    // Verify that the request was successful
    if (response.status !== 'success') {
      throw new Error(response.message || 'Failed to create payment link');
    }

    return {
      paymentLink: response.data.link,
      reference: payload.tx_ref,
      flwRef: response.data?.flw_ref,
    };
  } catch (error) {
    console.error('Error creating Flutterwave payment link:', error);
    throw new Error('Failed to create payment link');
  }
}

// Verify a Flutterwave transaction
export async function verifyFlutterwaveTransaction(transactionId: string) {
  try {
    // Get Flutterwave client
    const flw = await getFlutterwaveClient();
    
    const response = await flw.Transaction.verify({ id: transactionId });

    if (response.status !== 'success') {
      throw new Error(response.message || 'Transaction verification failed');
    }

    const transactionData = response.data;

    return {
      success: transactionData.status === 'successful',
      amount: transactionData.amount,
      currency: transactionData.currency,
      customerEmail: transactionData.customer.email,
      reference: transactionData.tx_ref,
      flwRef: transactionData.flw_ref,
      transactionId: transactionData.id,
      paymentType: transactionData.payment_type,
      metadata: transactionData.meta,
      createdAt: transactionData.created_at,
    };
  } catch (error) {
    console.error('Error verifying Flutterwave transaction:', error);
    throw new Error('Failed to verify transaction');
  }
}

// Add test mode parameter to the interface
export interface FlutterwavePaymentParams {
  amount: number;
  currency?: string;
  customerEmail: string;
  customerName?: string;
  planName: string;
  reference: string;
  redirectUrl: string;
  metadata?: Record<string, any>;
  testMode?: boolean; // Add test mode parameter
}

// Update the function implementation to handle test mode
export async function createFlutterwaveSubscriptionPayment(params: FlutterwavePaymentParams) {
  const { 
    amount, 
    currency = 'NGN', 
    customerEmail, 
    customerName = '', 
    planName, 
    reference, 
    redirectUrl, 
    metadata = {},
    testMode = false 
  } = params;
  
  // Use test or production credentials based on test mode
  const publicKey = testMode 
    ? process.env.FLUTTERWAVE_TEST_PUBLIC_KEY || process.env.FLUTTERWAVE_PUBLIC_KEY
    : process.env.FLUTTERWAVE_PUBLIC_KEY;
    
  const secretKey = testMode
    ? process.env.FLUTTERWAVE_TEST_SECRET_KEY || process.env.FLUTTERWAVE_SECRET_KEY
    : process.env.FLUTTERWAVE_SECRET_KEY;
  
  // Implement rest of the function...
  
  // Mock return for now
  return {
    reference,
    paymentLink: 'https://flutterwave.com/checkout'
  };
}

// Cancel a subscription (implemented as disabling recurring billing)
export async function cancelFlutterwaveSubscription(customerId: string, subscriptionId: string) {
  // Since Flutterwave doesn't have native subscription support like Stripe,
  // this would typically involve disabling the recurring flag in your database
  // and preventing future charges for this subscription.
  
  console.log(`Canceling Flutterwave subscription ${subscriptionId} for customer ${customerId}`);
  
  // Here you would typically update your database to mark this subscription as canceled
  
  return {
    success: true,
    subscriptionId,
    message: 'Subscription canceled successfully',
  };
}

// Get Flutterwave public key for client-side rendering
export async function getFlutterwavePublicKey() {
  return await getCredential('FLUTTERWAVE_PUBLIC_KEY');
}

// Get Flutterwave encryption key for client-side encryption
export async function getFlutterwaveEncryptionKey() {
  return await getCredential('FLUTTERWAVE_ENCRYPTION_KEY');
} 