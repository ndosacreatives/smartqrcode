import { 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  FacebookAuthProvider, 
  TwitterAuthProvider, 
  getAuth,
  AuthProvider // Import base AuthProvider type
} from "firebase/auth";
import { app, auth, isFirebaseAvailable } from "./firebase/config"; // Import isFirebaseAvailable and auth

// Initialize Firebase Authentication - ONLY if available
// const auth = getAuth(app); // We already get auth from config.ts

// --- Conditional Provider Initialization ---

let googleProvider: AuthProvider | null = null;
let githubProvider: AuthProvider | null = null;
let facebookProvider: AuthProvider | null = null;
let twitterProvider: AuthProvider | null = null;

if (isFirebaseAvailable()) {
  console.log("Firebase is available, initializing real auth providers.");
  try {
    googleProvider = new GoogleAuthProvider();
    // Set custom parameters if needed
    // googleProvider.setCustomParameters({ prompt: 'select_account' });

    githubProvider = new GithubAuthProvider();
    // githubProvider.addScope('repo'); // Example scope

    facebookProvider = new FacebookAuthProvider();
    // facebookProvider.addScope('email'); // Example scope

    twitterProvider = new TwitterAuthProvider();
    // Note: TwitterAuthProvider might have issues depending on Firebase/Twitter API changes.
  } catch (error) {
    console.error("Error initializing real auth providers:", error);
    // Keep providers as null if initialization fails
  }
} else {
  console.warn("Firebase not available (likely build time), auth providers will be null/stubs.");
  // We could create more detailed stubs if needed, but null might suffice
  // depending on how AVAILABLE_PROVIDERS is used.
}

// Export available providers - ONLY include providers that are configured in Firebase console
export const AVAILABLE_PROVIDERS = {
  google: {
    name: 'Google',
    enabled: true, // Set to true since you've enabled this in Firebase console
    provider: googleProvider // Use the conditionally initialized provider
  },
  // Explicitly set these to false since they're not configured
  twitter: {
    name: 'Twitter',
    enabled: false,
    provider: twitterProvider // Use the conditionally initialized provider
  },
  github: {
    name: 'GitHub',
    enabled: false,
    provider: githubProvider // Use the conditionally initialized provider
  },
  facebook: {
    name: 'Facebook',
    enabled: false,
    provider: facebookProvider // Use the conditionally initialized provider
  }
};

// Export the initialized providers directly if needed elsewhere, but prefer AVAILABLE_PROVIDERS
export { googleProvider, githubProvider, facebookProvider, twitterProvider };

// Define available auth providers
export const AUTH_PROVIDERS = [
  { id: 'google', name: 'Google', icon: 'google' },
  { id: 'facebook', name: 'Facebook', icon: 'facebook' },
  { id: 'github', name: 'GitHub', icon: 'github' },
  { id: 'twitter', name: 'Twitter', icon: 'twitter' }
];

// Function to check if a provider is available and initialized
export const isProviderEnabled = (providerId: string): boolean => {
  const providerKey = providerId.toLowerCase() as keyof typeof AVAILABLE_PROVIDERS;
  const providerInfo = AVAILABLE_PROVIDERS[providerKey];
  // Ensure the provider key exists, it's marked as enabled, AND the provider object itself is not null
  return providerInfo ? providerInfo.enabled && !!providerInfo.provider : false;
};

// Available provider options for UI display (this seems redundant with AUTH_PROVIDERS, consider removing one)
export const authProviderOptions = [
  { id: 'google', name: 'Google', icon: 'google' },
  { id: 'github', name: 'GitHub', icon: 'github' },
  { id: 'facebook', name: 'Facebook', icon: 'facebook' },
  { id: 'twitter', name: 'Twitter', icon: 'twitter' }
]; 