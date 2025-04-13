import { NextRequest, NextResponse } from 'next/server';
// import { getAuth } from '@clerk/nextjs/server';
import { incrementUsage } from '@/lib/usage-tracker';
import { auth as adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Verify the user's session
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized - No session cookie' },
        { status: 401 }
      );
    }

    // Verify the session and get the user ID
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedClaims.uid;

    // Parse the request body
    const { feature, amount = 1 } = await request.json();

    // Validate feature type
    const validFeatures = ['qrCodesGenerated', 'barcodesGenerated', 'bulkGenerations', 'aiCustomizations'];
    if (!validFeatures.includes(feature)) {
      return NextResponse.json(
        { error: 'Invalid feature type' },
        { status: 400 }
      );
    }

    // Track the usage
    try {
      for (let i = 0; i < Number(amount); i++) {
        await incrementUsage(
          userId, 
          feature
        );
      }
    } catch (usageError) {
      console.error('Error incrementing usage:', usageError);
      // Potentially return a specific error if usage tracking itself fails
      return NextResponse.json(
        { error: 'Failed to update usage count' },
        { status: 500 }
      );
    }
    
    // If incrementUsage completes without throwing, assume success
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking feature usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 