import { NextRequest, NextResponse } from 'next/server';
import { validateFirebaseAdminConnection } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Firebase Admin SDK connection...');
    
    // Test connection validation
    const result = await validateFirebaseAdminConnection();
    
    // Log environment variables (sanitized) for debugging
    const projectId = process.env.FIREBASE_PROJECT_ID || 'not-set';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL ? 
      `***${process.env.FIREBASE_CLIENT_EMAIL.split('@')[1] || ''}` : 'not-set';
    const privateKeyExists = process.env.FIREBASE_PRIVATE_KEY ? 'exists' : 'not-set';
    
    console.log('Firebase Environment Variables:');
    console.log(`- Project ID: ${projectId}`);
    console.log(`- Client Email: ${clientEmail}`);
    console.log(`- Private Key: ${privateKeyExists}`);
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Firebase Admin SDK connection is working correctly.' : 'Connection failed.',
      error: result.error || null,
      environment: {
        projectId,
        clientEmail,
        privateKeyExists,
        nodeEnv: process.env.NODE_ENV
      }
    }, {
      status: result.success ? 200 : 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error testing Firebase Admin SDK:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error testing Firebase Admin SDK connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache'
      }
    });
  }
} 