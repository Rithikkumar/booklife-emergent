/**
 * Application configuration constants
 * All configurable values should be defined here and read from environment variables
 */

// App domain configuration - used for generating URLs
export const APP_CONFIG = {
  // Domain for the application (without protocol)
  domain: import.meta.env.VITE_APP_DOMAIN || 'bookpassing.com',
  
  // Full URL for the application
  url: import.meta.env.VITE_APP_URL || 'https://bookpassing.com',
  
  // App name for display purposes
  name: 'BookPassing',
  
  // App description
  description: 'Track Your Books\' Journey',
} as const;

// Supabase configuration
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
} as const;

/**
 * Generate a book scan URL
 * @param code - The book code
 * @returns Full URL for scanning the book
 */
export const getBookScanUrl = (code: string): string => {
  return `${APP_CONFIG.url}/scan/${code}`;
};

/**
 * Generate a community join URL
 * @param communitySlug - The community slug
 * @returns Full URL for joining the community
 */
export const getCommunityJoinUrl = (communitySlug: string): string => {
  const uniqueId = Date.now().toString().slice(-4);
  return `${APP_CONFIG.url}/join/${communitySlug}-${uniqueId}`;
};

/**
 * Check if we're in development mode
 */
export const isDevelopment = import.meta.env.DEV;

/**
 * Check if we're in production mode
 */
export const isProduction = import.meta.env.PROD;
