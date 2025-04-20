import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

// Add no-cache headers to response
const addNoCacheHeaders = (response: NextResponse) => {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  return response;
};

// Get all QR codes
export async function GET(request: NextRequest) {
  try {
    console.log('Starting to fetch QR codes from Firestore...');
    
    // Get the collection reference
    const codesCollection = adminDb.collection('codes');
    
    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const userId = url.searchParams.get('userId');
    const type = url.searchParams.get('type'); // 'qrcode' or 'barcode'
    
    // Build the query
    let query = codesCollection.orderBy('createdAt', 'desc');
    
    // Add filters if specified
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    
    if (type && (type === 'qrcode' || type === 'barcode')) {
      query = query.where('type', '==', type);
    }
    
    // Apply the limit
    query = query.limit(limit);
    
    // Execute the query
    const snapshot = await query.get();
    
    console.log(`Retrieved snapshot with ${snapshot.size} QR codes`);
    
    // Get user data to map emails to user IDs
    const userIds = new Set<string>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.userId) {
        userIds.add(data.userId);
      }
    });
    
    // Get user data for all unique user IDs
    const userEmails: Record<string, string> = {};
    
    if (userIds.size > 0) {
      const usersSnapshot = await adminDb.collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', Array.from(userIds))
        .get();
      
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        if (userData.email) {
          userEmails[doc.id] = userData.email;
        }
      });
    }
    
    // Map the documents to a more usable format
    const qrCodes = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Get scan count from stats.scans or default to 0
      const scans = data.stats?.scans || 0;
      
      // Get the last scan timestamp
      const lastScan = data.stats?.lastScan;
      
      // Get user email if available
      const userEmail = data.userId ? userEmails[data.userId] : undefined;
      
      return {
        id: doc.id,
        userId: data.userId,
        userEmail,
        name: data.name || 'Untitled',
        content: data.content || '',
        type: data.type || 'qrcode',
        format: data.format,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
        scans: scans,
        lastScan: lastScan ? lastScan.toDate().toISOString() : null,
        customizations: data.settings || {}
      };
    });
    
    console.log(`Processed ${qrCodes.length} QR codes`);
    
    // Return the response with cache control headers
    return addNoCacheHeaders(
      NextResponse.json({ qrCodes }, { status: 200 })
    );
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    
    let errorMessage = 'Failed to fetch QR codes';
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