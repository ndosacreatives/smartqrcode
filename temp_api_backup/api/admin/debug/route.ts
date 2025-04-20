import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const cwd = process.cwd();
    const rootFiles = fs.readdirSync(cwd);
    
    // Check for the service account file
    const serviceAccountPath = path.join(cwd, 'firebase-key.json');
    const serviceAccountExists = fs.existsSync(serviceAccountPath);
    
    // Check other potential locations
    const srcPath = path.join(cwd, 'src');
    const srcExists = fs.existsSync(srcPath);
    let srcFiles: string[] = [];
    
    if (srcExists) {
      srcFiles = fs.readdirSync(srcPath);
    }
    
    return NextResponse.json({
      currentWorkingDirectory: cwd,
      rootFiles,
      serviceAccountExists,
      serviceAccountPath,
      srcExists,
      srcFiles
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 