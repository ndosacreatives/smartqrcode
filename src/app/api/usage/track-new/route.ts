import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { incrementUsage } from '@/lib/usage-tracker';

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

    try {
      // Verify the session and get the user ID
      const decodedClaims = await auth.verifySessionCookie(sessionCookie);
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
        // Call incrementUsage for each count in amount
        for (let i = 0; i < Number(amount); i++) {
          await incrementUsage(userId, feature);
        }
        
        return NextResponse.json({ success: true });
      } catch (usageError) {
        console.error('Error incrementing usage:', usageError);
        return NextResponse.json(
          { error: 'Failed to update usage count' },
          { status: 500 }
        );
      }
    } catch (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error tracking feature usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 