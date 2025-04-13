import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
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

    // Reset the user's usage stats
    const success = await resetUsageStats(userId, feature);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to reset usage stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: feature ? `Usage for ${feature} reset successfully` : 'All usage stats reset successfully'
    });
  } catch (error) {
    console.error('Error resetting usage stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 