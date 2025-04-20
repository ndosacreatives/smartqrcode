import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth, db } from '@/lib/firebase-admin';
import { resetUsageStats } from '@/lib/usage-tracker';

export async function POST(request: NextRequest) {
  try {
    // Verify the admin session
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized - No session cookie' },
        { status: 401 }
      );
    }

    // Verify the admin's session and claims
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    const adminId = decodedClaims.uid;
    
    // Get the admin's claims to verify admin status
    const adminRecord = await adminAuth.getUser(adminId);
    const isAdmin = adminRecord.customClaims?.role === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Parse the request body to get the user ID and optionally the feature to reset
    const { userId, feature } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Reset the user's usage stats using a try...catch block
    try {
      await resetUsageStats(userId, feature);
      // If resetUsageStats completes without throwing, it was successful
      return NextResponse.json({
        success: true,
        message: feature ? `Usage for ${feature} reset successfully` : 'All usage stats reset successfully'
      });
    } catch (resetError) {
      console.error('Error calling resetUsageStats:', resetError);
      return NextResponse.json(
        { error: 'Failed to reset usage stats' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    // Catch errors from session verification, parsing request, etc.
    console.error('Error in POST /api/admin/reset-usage:', error);
    // Determine the error type for a more specific message if possible
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Admin access required'))) {
      statusCode = error.message.includes('Unauthorized') ? 401 : 403;
      errorMessage = error.message;
    } else if (error instanceof Error && error.message.includes('User ID is required')) {
      statusCode = 400;
      errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
} 