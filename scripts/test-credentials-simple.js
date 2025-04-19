/**
 * Simple credential test script that only checks environment variables
 * without attempting to initialize Firebase Admin or other services
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Check environment variables directly
function testEnvironmentCredentials() {
  console.log('=== Testing Environment Credentials ===\n');
  
  // Payment provider credentials
  const credentialsToCheck = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLIC_KEY',
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
    'FLUTTERWAVE_PUBLIC_KEY',
    'FLUTTERWAVE_SECRET_KEY',
    'FLUTTERWAVE_ENCRYPTION_KEY'
  ];
  
  let foundCount = 0;
  let missingCount = 0;

  for (const key of credentialsToCheck) {
    const value = process.env[key];
    if (value) {
      // Mask sensitive credential values
      const maskedValue = value.substring(0, 4) + '...' + value.substring(value.length - 4);
      console.log(`${key}: ✅ Found (${maskedValue})`);
      foundCount++;
    } else {
      console.log(`${key}: ❌ Not found`);
      missingCount++;
    }
  }
  
  console.log('\nSummary:');
  console.log(`✅ Found: ${foundCount} credentials`);
  console.log(`❌ Missing: ${missingCount} credentials`);
  
  console.log('\n=== Credential Test Completed ===');
}

// Run the test
testEnvironmentCredentials(); 