# Credential Management System

This document outlines the credential management system used in the SmartQRCode application.

## Overview

The application uses a centralized credential management system to securely access API keys and other sensitive information. The system provides an abstraction layer that allows credentials to be stored and retrieved from multiple sources:

1. Environment variables (for local development and quick setup)
2. Firestore database (for production, with optional encryption)

## Core Functions

The credential system is defined in `src/lib/credentials.ts` and includes these main functions:

- `getCredential(key: string)`: Retrieves a credential by its key
- `getCredentials(keys: string[])`: Retrieves multiple credentials by their keys
- `hasCredential(key: string)`: Checks if a credential exists

All these functions are asynchronous and return Promises.

## How to Use

### Retrieving a Single Credential

```typescript
import { getCredential } from '@/lib/credentials';

async function myFunction() {
  const apiKey = await getCredential('MY_API_KEY');
  
  if (!apiKey) {
    throw new Error('API key not configured');
  }
  
  // Use apiKey here
}
```

### Retrieving Multiple Credentials

```typescript
import { getCredentials } from '@/lib/credentials';

async function myFunction() {
  const [apiKey, apiSecret] = await getCredentials(['API_KEY', 'API_SECRET']);
  
  // Check if all credentials were found
  if (!apiKey || !apiSecret) {
    throw new Error('Missing required credentials');
  }
  
  // Use credentials here
}
```

### Checking for Credential Existence

```typescript
import { hasCredential } from '@/lib/credentials';

async function myFunction() {
  const hasApiKey = await hasCredential('MY_API_KEY');
  
  if (hasApiKey) {
    // Proceed with API key
  } else {
    // Handle missing API key
  }
}
```

## Payment Provider Integration

The credential system is used by all payment provider integrations:

### Stripe

```typescript
// src/lib/stripe.ts
export async function getStripeClient() {
  const stripeSecretKey = await getCredential('STRIPE_SECRET_KEY');
  
  if (!stripeSecretKey) {
    throw new Error('Stripe API key not configured');
  }
  
  return new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
  });
}
```

### PayPal

```typescript
// src/lib/paypal.ts
async function getClient() {
  if (!paypalClient) {
    const clientId = await getCredential('PAYPAL_CLIENT_ID');
    const clientSecret = await getCredential('PAYPAL_CLIENT_SECRET');
    
    // Initialize client...
  }
  return paypalClient;
}
```

### Flutterwave

```typescript
// src/lib/flutterwave.ts
async function getFlutterwaveClient() {
  if (!flutterwaveClient) {
    const publicKey = await getCredential('FLUTTERWAVE_PUBLIC_KEY');
    const secretKey = await getCredential('FLUTTERWAVE_SECRET_KEY');
    
    // Initialize client...
  }
  return flutterwaveClient;
}
```

## Configuration

### Local Development

For local development, credentials can be stored in environment variables:

```
# .env.local
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
PAYPAL_CLIENT_ID=test_client_id...
PAYPAL_CLIENT_SECRET=test_client_secret...
```

### Production Environment

For production, credentials should be stored in the Firestore database in the `credentials` collection. Each document should have:

- ID matching the credential key (e.g., "STRIPE_SECRET_KEY")
- A `value` field containing the credential
- Optionally an `encrypted` field set to true if the value is encrypted

## Testing Credentials

Use the test script to verify credential access:

```bash
npm run test:credentials
```

This script will check access to all payment provider credentials and report any issues.

## Security Considerations

1. Never hardcode credentials in the source code
2. Always use the credential system instead of accessing environment variables directly
3. For production, use the encrypted storage option in Firestore
4. Restrict access to the `credentials` collection in Firestore using appropriate security rules
5. Rotate credentials periodically according to security policy 