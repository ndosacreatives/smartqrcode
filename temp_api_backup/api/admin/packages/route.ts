import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { checkAdminAuth } from '@/lib/admin-auth';

// Add no-cache headers to response
const addNoCacheHeaders = (response: NextResponse) => {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  return response;
};

// GET: Retrieve current package definitions
export async function GET(request: NextRequest) {
  try {
    // Verify admin user
    const adminUser = await checkAdminAuth(request);
    if (!adminUser) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
      );
    }
    
    // Get the package document
    const packagesDoc = await adminDb.collection('system').doc('subscriptions').get();
    
    if (!packagesDoc.exists) {
      // Return default packages from code if not found in DB
      return addNoCacheHeaders(
        NextResponse.json({ 
          message: 'Using default package definitions',
          packages: {
            // Return defaults here if needed
          }
        }, { status: 200 })
      );
    }
    
    // Return the subscription packages
    return addNoCacheHeaders(
      NextResponse.json({ 
        packages: packagesDoc.data()
      }, { status: 200 })
    );
  } catch (error) {
    console.error('Error fetching packages:', error);
    
    let errorMessage = 'Failed to fetch packages';
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

// POST: Update package definitions
export async function POST(request: Request) {
  try {
    const { pricing, features } = await request.json();
    
    if (!pricing || !features) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Pricing and features are required' }, { status: 400 })
      );
    }
    
    // Validate the data structure
    if (!validatePackages(pricing, features)) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'Invalid package data structure' }, { status: 400 })
      );
    }
    
    // Save to Firestore
    const now = admin.firestore.Timestamp.now();
    await adminDb.collection('system').doc('subscriptions').set({
      pricing,
      features,
      updatedAt: now
    }, { merge: true });
    
    // Return success
    return addNoCacheHeaders(
      NextResponse.json({ 
        success: true,
        message: 'Packages updated successfully',
        timestamp: now.toDate().toISOString()
      }, { status: 200 })
    );
  } catch (error) {
    console.error('Error updating packages:', error);
    
    let errorMessage = 'Failed to update packages';
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

// Helper function to validate package data
function validatePackages(pricing: any, features: any): boolean {
  // Check pricing
  if (typeof pricing !== 'object') return false;
  
  // Ensure all required tiers exist
  const requiredTiers = ['free', 'pro', 'business'];
  for (const tier of requiredTiers) {
    if (!pricing.hasOwnProperty(tier) || typeof pricing[tier] !== 'number') {
      return false;
    }
    
    if (!features.hasOwnProperty(tier) || typeof features[tier] !== 'object') {
      return false;
    }
  }
  
  // Check features for required properties
  const requiredFeatures = [
    'maxQRCodes', 
    'maxBarcodes', 
    'bulkGenerationAllowed', 
    'maxBulkItems', 
    'aiCustomizationAllowed',
    'maxAICustomizations',
    'analyticsEnabled',
    'customBrandingAllowed',
    'teamMembersAllowed',
    'maxTeamMembers'
  ];
  
  for (const tier of requiredTiers) {
    for (const feature of requiredFeatures) {
      if (!features[tier].hasOwnProperty(feature)) {
        return false;
      }
      
      // Type checking
      const value = features[tier][feature];
      if (
        feature.startsWith('max') && typeof value !== 'number' ||
        feature.endsWith('Allowed') && typeof value !== 'boolean' ||
        feature.endsWith('Enabled') && typeof value !== 'boolean'
      ) {
        return false;
      }
    }
  }
  
  return true;
} 