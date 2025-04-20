import { 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  FacebookAuthProvider, 
  TwitterAuthProvider, 
  getAuth 
} from "firebase/auth";
import { app } from "./firebase/config";

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Create Google Provider for direct export 
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.setCustomParameters({
  prompt: 'select_account' // Force account selection even when one account is available
});

// Define available auth providers
export const providers = {
  google: googleProvider, // Use the googleProvider constant here
  github: new GithubAuthProvider(),
  facebook: new FacebookAuthProvider(),
  twitter: new TwitterAuthProvider()
};

// Configure providers with additional scopes/parameters
// GitHub provider configuration
providers.github.addScope('read:user');
providers.github.addScope('user:email');

// Facebook provider configuration
providers.facebook.addScope('email');
providers.facebook.addScope('public_profile');

// Helper function to get a provider by name
export const getProvider = (providerName: string) => {
  const provider = providers[providerName as keyof typeof providers];
  if (!provider) {
    throw new Error(`Auth provider ${providerName} not configured`);
  }
  return provider;
};

// Available provider options for UI display
export const authProviderOptions = [
  { id: 'google', name: 'Google', icon: 'google' },
  { id: 'github', name: 'GitHub', icon: 'github' },
  { id: 'facebook', name: 'Facebook', icon: 'facebook' },
  { id: 'twitter', name: 'Twitter', icon: 'twitter' }
];

// Export available providers - ONLY include providers that are configured in Firebase console
export const AVAILABLE_PROVIDERS = {
  google: {
    name: 'Google',
    enabled: true, // Set to true since you've enabled this in Firebase console
    provider: googleProvider
  },
  // Explicitly set these to false since they're not configured
  twitter: {
    name: 'Twitter',
    enabled: false
  },
  github: {
    name: 'GitHub',
    enabled: false
  },
  facebook: {
    name: 'Facebook',
    enabled: false
  }
};

// Function to check if a provider is available
export function isProviderEnabled(providerName: string): boolean {
  return !!AVAILABLE_PROVIDERS[providerName as keyof typeof AVAILABLE_PROVIDERS]?.enabled;
} 