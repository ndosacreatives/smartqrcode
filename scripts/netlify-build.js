/**
 * Custom build script for Netlify to handle static generation correctly
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

// Define sections to exclude from static generation
const excludedPaths = [
  'admin',
  'admin-login',
  'account',
  'auth',
  'dashboard',
  'checkout',
  'profile'
];

// Set environment variables for build
process.env.NEXT_DISABLE_ESLINT = '1';
process.env.NEXT_DISABLE_TYPE_CHECKS = '1';

// Run the Next.js build
console.log('🏗️ Running Next.js build and export...');
try {
  // Run Next.js build with export
  execSync('next build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_DISABLE_ESLINT: '1',
      NEXT_DISABLE_TYPE_CHECKS: '1'
    } 
  });
  
  console.log('✅ Build completed. Now cleaning up excluded routes...');
  
  // The 'out' directory should contain the exported static site
  if (fs.existsSync('out')) {
    console.log('🧹 Removing excluded paths from static export...');
    
    // Remove excluded paths
    excludedPaths.forEach(excludedPath => {
      const fullPath = path.join('out', excludedPath);
      if (fs.existsSync(fullPath)) {
        console.log(`🗑️ Removing: ${fullPath}`);
        try {
          rimraf.sync(fullPath);
        } catch (err) {
          console.error(`Failed to remove ${fullPath}:`, err);
        }
      }
    });
    
    // Create placeholder pages for excluded paths
    console.log('📝 Creating placeholder pages for excluded paths...');
    excludedPaths.forEach(excludedPath => {
      createPlaceholderPage(excludedPath);
    });
  } else {
    console.error('❌ Output directory "out" not found!');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Build failed:', error);
  
  // Create out directory if it doesn't exist (for minimum viable deployment)
  if (!fs.existsSync('out')) {
    fs.mkdirSync('out', { recursive: true });
    
    // Create a minimal index.html
    const minimalHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Smart QR Code Generator</title>
        <style>
          body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
          .error { background: #f8d7da; color: #842029; padding: 1rem; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>Smart QR Code Generator</h1>
        <div class="error">
          <p>There was an error during the build process.</p>
          <p>Please try again later or contact the site administrator.</p>
        </div>
      </body>
      </html>
    `.trim();
    
    fs.writeFileSync(path.join('out', 'index.html'), minimalHtml);
    console.log('📄 Created minimal index.html as fallback');
  }
  
  process.exit(1);
}

// Function to create a placeholder page that redirects to home
function createPlaceholderPage(pagePath) {
  const folderPath = path.join('out', pagePath);
  
  // Create folder if it doesn't exist
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  
  // Create index.html in the folder
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Redirecting...</title>
      <script>
        window.location.href = "/";
      </script>
    </head>
    <body>
      <p>Redirecting to home page...</p>
    </body>
    </html>
  `.trim();
  
  fs.writeFileSync(path.join(folderPath, 'index.html'), html);
  console.log(`📄 Created placeholder: ${folderPath}/index.html`);
} 