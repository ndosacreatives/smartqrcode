import { auth } from "@/lib/firebase-admin";
import { getUserById, saveUserData } from "@/lib/firestore";
import { NextRequest, NextResponse } from "next/server";

// Get the current user's profile
export async function GET(req: NextRequest) {
  try {
    // Get Firebase ID token from request cookies
    const sessionCookie = req.cookies.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized: No session cookie" },
        { status: 401 }
      );
    }

    // Verify session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid session" },
        { status: 401 }
      );
    }

    // Get user data from Firestore
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error getting user profile:", error);
    return NextResponse.json(
      { error: "Error fetching user profile" },
      { status: 500 }
    );
  }
}

// Update the current user's profile
export async function PATCH(req: NextRequest) {
  try {
    // Get Firebase ID token from request cookies
    const sessionCookie = req.cookies.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized: No session cookie" },
        { status: 401 }
      );
    }

    // Verify session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid session" },
        { status: 401 }
      );
    }

    // Get the request body (the updated profile data)
    const requestData = await req.json();
    
    // Validate and extract allowed fields
    const allowedFields = ['displayName'];
    const updateData: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (requestData[field] !== undefined) {
        updateData[field] = requestData[field];
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update the user data in Firestore
    await saveUserData(userId, updateData, true);

    return NextResponse.json(
      { message: "Profile updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Error updating user profile" },
      { status: 500 }
    );
  }
} 