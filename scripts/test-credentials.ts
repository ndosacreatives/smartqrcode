import { getCredential } from '@/lib/credentials';
import { getStripeClient, getStripePublicKey } from '@/lib/stripe';
import { getPayPalClientId } from '@/lib/paypal';
import { getFlutterwavePublicKey, getFlutterwaveEncryptionKey } from '@/lib/flutterwave';

async function testCredentialSystem() {
  console.log('=== Testing Credential System ===');
  
  try {
    // 1. Test direct credential access
    console.log('\n1. Testing direct credential access:');
    const testApiKey = await getCredential('TEST_API_KEY');
    console.log(`TEST_API_KEY: ${testApiKey ? '✅ Found' : '❌ Not found'}`);
    
    // 2. Test Stripe credentials
    console.log('\n2. Testing Stripe credentials:');
    try {
      const stripePublicKey = await getStripePublicKey();
      console.log(`STRIPE_PUBLIC_KEY: ${stripePublicKey ? '✅ Found' : '❌ Not found'}`);
      
      const stripeClient = await getStripeClient();
      console.log('Stripe client: ✅ Successfully initialized');
    } catch (error: any) {
      console.error('Stripe error:', error.message);
    }
    
    // 3. Test PayPal credentials
    console.log('\n3. Testing PayPal credentials:');
    try {
      const paypalClientId = await getPayPalClientId();
      console.log(`PAYPAL_CLIENT_ID: ${paypalClientId ? '✅ Found' : '❌ Not found'}`);
    } catch (error: any) {
      console.error('PayPal error:', error.message);
    }
    
    // 4. Test Flutterwave credentials
    console.log('\n4. Testing Flutterwave credentials:');
    try {
      const flutterwavePublicKey = await getFlutterwavePublicKey();
      console.log(`FLUTTERWAVE_PUBLIC_KEY: ${flutterwavePublicKey ? '✅ Found' : '❌ Not found'}`);
      
      const flutterwaveEncryptionKey = await getFlutterwaveEncryptionKey();
      console.log(`FLUTTERWAVE_ENCRYPTION_KEY: ${flutterwaveEncryptionKey ? '✅ Found' : '❌ Not found'}`);
    } catch (error: any) {
      console.error('Flutterwave error:', error.message);
    }
    
    console.log('\n=== Credential System Test Completed ===');
  } catch (error: any) {
    console.error('Test failed with error:', error.message);
  }
}

// Run the test
testCredentialSystem().catch((error: any) => console.error('Unhandled error:', error.message)); 