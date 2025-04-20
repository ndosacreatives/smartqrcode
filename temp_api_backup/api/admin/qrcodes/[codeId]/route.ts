import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

// Add no-cache headers to response
const addNoCacheHeaders = (response: NextResponse) => {
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  return response;
};

// Get specific QR code
export async function GET(
  request: Request,
  { params }: { params: { codeId: string } }
) {
  try {
    const codeId = params.codeId;
    const codeRef = adminDb.collection('codes').doc(codeId);
    const codeSnapshot = await codeRef.get();

    if (!codeSnapshot.exists) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'QR code not found' }, { status: 404 })
      );
    }

    const data = codeSnapshot.data();
    
    // Get user email
    let userEmail = undefined;
    if (data?.userId) {
      const userSnapshot = await adminDb.collection('users').doc(data.userId).get();
      if (userSnapshot.exists) {
        userEmail = userSnapshot.data()?.email;
      }
    }

    // Format the data
    const qrCode = {
      id: codeSnapshot.id,
      userId: data?.userId,
      userEmail,
      name: data?.name || 'Untitled',
      content: data?.content || '',
      type: data?.type || 'qrcode',
      format: data?.format,
      createdAt: data?.createdAt ? data.createdAt.toDate().toISOString() : null,
      updatedAt: data?.updatedAt ? data.updatedAt.toDate().toISOString() : null,
      scans: data?.stats?.scans || 0,
      lastScan: data?.stats?.lastScan ? data.stats.lastScan.toDate().toISOString() : null,
      customizations: data?.settings || {}
    };

    return addNoCacheHeaders(
      NextResponse.json({ qrCode }, { status: 200 })
    );
  } catch (error) {
    console.error('Error fetching QR code:', error);
    return addNoCacheHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    );
  }
}

// Update QR code
export async function PATCH(
  request: Request,
  { params }: { params: { codeId: string } }
) {
  try {
    const codeId = params.codeId;
    const body = await request.json();

    // Allowed fields to update
    const allowedFields = ['name', 'content', 'settings'];
    
    // Prepare data to update
    const dataToUpdate: Record<string, any> = {};
    
    // Only include fields that are allowed and provided
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        dataToUpdate[field] = body[field];
      }
    }
    
    // Add updatedAt timestamp
    dataToUpdate.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    // Check if there are fields to update
    if (Object.keys(dataToUpdate).length === 1 && 'updatedAt' in dataToUpdate) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
      );
    }

    // Get reference to the code document
    const codeRef = adminDb.collection('codes').doc(codeId);
    
    // Check if the code exists
    const codeSnapshot = await codeRef.get();
    if (!codeSnapshot.exists) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'QR code not found' }, { status: 404 })
      );
    }
    
    // Update the document
    await codeRef.update(dataToUpdate);

    return addNoCacheHeaders(
      NextResponse.json({ message: 'QR code updated successfully' }, { status: 200 })
    );
  } catch (error) {
    console.error('Error updating QR code:', error);
    return addNoCacheHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    );
  }
}

// Delete QR code
export async function DELETE(
  request: Request,
  { params }: { params: { codeId: string } }
) {
  try {
    const codeId = params.codeId;
    
    // Get reference to the code document
    const codeRef = adminDb.collection('codes').doc(codeId);
    
    // Check if the code exists
    const codeSnapshot = await codeRef.get();
    if (!codeSnapshot.exists) {
      return addNoCacheHeaders(
        NextResponse.json({ error: 'QR code not found' }, { status: 404 })
      );
    }
    
    // Delete the document
    await codeRef.delete();
    
    // Return success response
    return addNoCacheHeaders(
      NextResponse.json({
        success: true,
        message: 'QR code deleted successfully'
      }, { status: 200 })
    );
  } catch (error) {
    console.error('Error deleting QR code:', error);
    return addNoCacheHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    );
  }
} 