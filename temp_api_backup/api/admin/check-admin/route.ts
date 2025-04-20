import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-auth';

// Add no-cache headers to prevent caching of auth status
function addNoCacheHeaders(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

/**
 * API endpoint to check if a user has admin privileges
 * @param request NextRequest object
 * @returns NextResponse with appropriate status
 */
export async function GET(request: NextRequest) {
  // Log the incoming request
  console.log('Admin check request received');
  
  try {
    // Check if the user is an admin
    const adminUser = await checkAdminAuth(request);
    
    if (adminUser) {
      // User is an admin, return success
      console.log(`Admin check successful for user: ${adminUser.uid}`);
      return addNoCacheHeaders(
        NextResponse.json(
          { 
            success: true, 
            message: 'User has admin privileges',
            uid: adminUser.uid 
          }, 
          { status: 200 }
        )
      );
    } else {
      // User is not an admin, return forbidden
      console.log('Admin check failed: User does not have admin privileges');
      return addNoCacheHeaders(
        NextResponse.json(
          { 
            success: false, 
            message: 'User does not have admin privileges' 
          }, 
          { status: 403 }
        )
      );
    }
  } catch (error) {
    // An error occurred, log and return server error
    console.error('Error in admin check endpoint:', error);
    return addNoCacheHeaders(
      NextResponse.json(
        { 
          success: false, 
          message: 'Error checking admin status',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 
        { status: 500 }
      )
    );
  }
}

// Also allow POST requests for compatibility
export const POST = GET; 