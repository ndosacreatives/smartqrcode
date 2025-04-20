/**
 * Simple script to check Node.js version before building
 */

// Get the current Node.js version
const currentVersion = process.version;
console.log(`Current Node.js version: ${currentVersion}`);

// Extract the major version number (e.g., 'v14.17.0' -> 14)
const majorVersion = parseInt(currentVersion.slice(1).split('.')[0], 10);

// Define acceptable version range
const MIN_VERSION = 18;
const MAX_VERSION = 22;

if (isNaN(majorVersion)) {
  console.error('❌ Could not determine Node.js version!');
  process.exit(1);
}

if (majorVersion < MIN_VERSION) {
  console.error(`❌ Node.js version too old! v${majorVersion}.x is not supported.`);
  console.error(`Please use Node.js v${MIN_VERSION}.x or newer (but below v${MAX_VERSION}.x).`);
  process.exit(1);
}

if (majorVersion >= MAX_VERSION) {
  console.warn(`⚠️ WARNING: Using Node.js v${majorVersion}.x which might not be fully tested.`);
  console.warn(`Consider using Node.js v${MIN_VERSION}.x - v${MAX_VERSION-1}.x for better compatibility.`);
  
  // Allow the build to continue with newer versions, but warn the user
  // If you want to strictly enforce, uncomment the line below:
  // process.exit(1);
}

console.log(`✅ Node.js version v${majorVersion}.x is acceptable. Continuing with build...`); 