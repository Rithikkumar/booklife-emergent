/**
 * API Response Validation Utilities
 * Validates and sanitizes data from external APIs to prevent XSS and data corruption
 */

import { z } from 'zod';

// Maximum allowed lengths for text fields from external APIs
const MAX_TITLE_LENGTH = 500;
const MAX_AUTHOR_LENGTH = 200;
const MAX_ADDRESS_LENGTH = 500;
const MAX_LOCATION_NAME_LENGTH = 200;

/**
 * Sanitizes a string by removing potentially dangerous characters
 * and limiting length. React JSX escaping handles most XSS, but this
 * provides defense in depth.
 */
export const sanitizeString = (value: unknown, maxLength: number = 500): string => {
  if (typeof value !== 'string') return '';
  
  // Trim and limit length
  let sanitized = value.trim().slice(0, maxLength);
  
  // Remove null bytes and control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
};

/**
 * Validates a URL is from an allowed domain
 */
export const isAllowedImageUrl = (url: unknown): boolean => {
  if (typeof url !== 'string') return false;
  
  const allowedDomains = [
    'covers.openlibrary.org',
    'books.google.com',
    'www.googleapis.com',
    'books.googleusercontent.com',
  ];
  
  try {
    const parsed = new URL(url);
    return allowedDomains.some(domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
};

// ============================================
// OpenLibrary API Validation
// ============================================

const OpenLibraryBookSchema = z.object({
  key: z.string().optional(),
  title: z.string().transform(val => sanitizeString(val, MAX_TITLE_LENGTH)),
  author_name: z.array(z.string().transform(val => sanitizeString(val, MAX_AUTHOR_LENGTH))).optional(),
  cover_i: z.number().int().positive().optional(),
  isbn: z.array(z.string().max(20)).optional(),
  first_publish_year: z.number().int().min(1000).max(2100).optional(),
});

const OpenLibrarySearchResultSchema = z.object({
  docs: z.array(OpenLibraryBookSchema).default([]),
});

export type ValidatedOpenLibraryBook = z.infer<typeof OpenLibraryBookSchema>;
export type ValidatedOpenLibrarySearchResult = z.infer<typeof OpenLibrarySearchResultSchema>;

/**
 * Validates OpenLibrary search API response
 */
export const validateOpenLibraryResponse = (data: unknown): ValidatedOpenLibrarySearchResult => {
  const result = OpenLibrarySearchResultSchema.safeParse(data);
  
  if (!result.success) {
    console.warn('OpenLibrary response validation failed:', result.error.errors);
    return { docs: [] };
  }
  
  return result.data;
};

// ============================================
// Google Books API Validation
// ============================================

const GoogleBooksImageLinksSchema = z.object({
  thumbnail: z.string().optional(),
  small: z.string().optional(),
  medium: z.string().optional(),
  large: z.string().optional(),
}).optional();

const GoogleBooksVolumeSchema = z.object({
  volumeInfo: z.object({
    imageLinks: GoogleBooksImageLinksSchema,
  }).optional(),
});

const GoogleBooksResultSchema = z.object({
  items: z.array(GoogleBooksVolumeSchema).optional(),
});

export type ValidatedGoogleBooksResult = z.infer<typeof GoogleBooksResultSchema>;

/**
 * Validates Google Books API response
 */
export const validateGoogleBooksResponse = (data: unknown): ValidatedGoogleBooksResult => {
  const result = GoogleBooksResultSchema.safeParse(data);
  
  if (!result.success) {
    console.warn('Google Books response validation failed:', result.error.errors);
    return { items: [] };
  }
  
  return result.data;
};

// ============================================
// Nominatim Geocoding API Validation
// ============================================

const NominatimAddressSchema = z.object({
  neighbourhood: z.string().transform(val => sanitizeString(val, MAX_LOCATION_NAME_LENGTH)).optional(),
  suburb: z.string().transform(val => sanitizeString(val, MAX_LOCATION_NAME_LENGTH)).optional(),
  district: z.string().transform(val => sanitizeString(val, MAX_LOCATION_NAME_LENGTH)).optional(),
  city: z.string().transform(val => sanitizeString(val, MAX_LOCATION_NAME_LENGTH)).optional(),
  town: z.string().transform(val => sanitizeString(val, MAX_LOCATION_NAME_LENGTH)).optional(),
  village: z.string().transform(val => sanitizeString(val, MAX_LOCATION_NAME_LENGTH)).optional(),
  county: z.string().transform(val => sanitizeString(val, MAX_LOCATION_NAME_LENGTH)).optional(),
  state: z.string().transform(val => sanitizeString(val, MAX_LOCATION_NAME_LENGTH)).optional(),
  country: z.string().transform(val => sanitizeString(val, MAX_LOCATION_NAME_LENGTH)).optional(),
  country_code: z.string().max(10).optional(),
  state_district: z.string().transform(val => sanitizeString(val, MAX_LOCATION_NAME_LENGTH)).optional(),
  municipality: z.string().transform(val => sanitizeString(val, MAX_LOCATION_NAME_LENGTH)).optional(),
  hamlet: z.string().transform(val => sanitizeString(val, MAX_LOCATION_NAME_LENGTH)).optional(),
}).optional();

const NominatimResultSchema = z.object({
  lat: z.string().refine(val => !isNaN(parseFloat(val)), 'Invalid latitude'),
  lon: z.string().refine(val => !isNaN(parseFloat(val)), 'Invalid longitude'),
  display_name: z.string().transform(val => sanitizeString(val, MAX_ADDRESS_LENGTH)),
  address: NominatimAddressSchema,
});

const NominatimResultsSchema = z.array(NominatimResultSchema);

export type ValidatedNominatimResult = z.infer<typeof NominatimResultSchema>;

/**
 * Validates Nominatim geocoding API response
 */
export const validateNominatimResponse = (data: unknown): ValidatedNominatimResult[] => {
  const result = NominatimResultsSchema.safeParse(data);
  
  if (!result.success) {
    console.warn('Nominatim response validation failed:', result.error.errors);
    return [];
  }
  
  return result.data;
};

// ============================================
// Session/Cache Cleanup Utilities
// ============================================

/**
 * Clears all community message caches from localStorage
 */
export const clearCommunityMessageCaches = (): void => {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('community_messages_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

/**
 * Clears security logs from sessionStorage
 */
export const clearSecurityLogs = (): void => {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith('security_log_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => sessionStorage.removeItem(key));
};

/**
 * Clears all sensitive cached data (call on logout)
 */
export const clearSensitiveData = (): void => {
  clearCommunityMessageCaches();
  clearSecurityLogs();
};
