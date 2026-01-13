import { validateNominatimResponse, type ValidatedNominatimResult } from '@/utils/apiValidation';
import { logger } from '@/utils/logger';

export interface LocationData {
  neighborhood?: string;
  district?: string;
  city: string;
  state?: string;
  country: string;
  countryCode?: string;
  stateCode?: string;
  coordinates: [number, number];
  formattedAddress: string;
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const MIN_REQUEST_INTERVAL = 1100; // Slightly over 1 second to be safe with Nominatim policy
let lastRequestTime = 0;

// LocalStorage cache key
const CACHE_STORAGE_KEY = 'bookpassing_location_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours - locations don't change often

// In-memory cache backed by localStorage
let memoryCache: Map<string, { results: LocationData[], timestamp: number }> = new Map();

// Initialize cache from localStorage
function initCache() {
  if (memoryCache.size === 0) {
    try {
      const stored = localStorage.getItem(CACHE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        // Only restore non-expired entries
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          if (now - value.timestamp < CACHE_DURATION) {
            memoryCache.set(key, value);
          }
        });
      }
    } catch (e) {
      logger.warn('Failed to load location cache from localStorage');
    }
  }
}

// Save cache to localStorage (debounced)
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
function saveCache() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const cacheObj: Record<string, any> = {};
      memoryCache.forEach((value, key) => {
        cacheObj[key] = value;
      });
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheObj));
    } catch (e) {
      logger.warn('Failed to save location cache to localStorage');
    }
  }, 1000);
}

async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

export const searchLocations = async (query: string): Promise<LocationData[]> => {
  if (query.length < 2) return [];
  
  // Initialize cache from localStorage on first call
  initCache();
  
  const cacheKey = query.toLowerCase().trim();
  
  // Check cache first
  const cached = memoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.results;
  }

  try {
    // Wait for rate limiting
    await waitForRateLimit();

    // Global search - no country bias
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=12&accept-language=en`
    );

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('RATE_LIMIT');
      }
      throw new Error('NETWORK_ERROR');
    }

    const rawResults = await response.json();
    let allResults: ValidatedNominatimResult[] = validateNominatimResponse(rawResults);
    
    const processedResults = allResults
      .filter(result => result.address)
      .map(result => {
        const addr = result.address!;
        
        // Extract location components with global priority order
        const neighborhood = addr.neighbourhood || addr.suburb || addr.hamlet || addr.quarter;
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.locality;
        const district = addr.district || addr.county || addr.state_district || addr.region;
        const state = addr.state || addr.province;
        const country = addr.country || '';
        const countryCode = addr.country_code?.toUpperCase();
        
        // For any place type, be flexible with what we consider a valid location
        const primaryLocation = city || neighborhood || district || addr.name;
        
        // Create proper formatted address with administrative hierarchy
        const formattedParts: string[] = [];
        
        // Add the most specific location first
        if (primaryLocation) {
          // Add place type indicator for small places
          if (addr.village && addr.village === primaryLocation) {
            formattedParts.push(`${primaryLocation} (Village)`);
          } else if (addr.hamlet && addr.hamlet === primaryLocation) {
            formattedParts.push(`${primaryLocation} (Hamlet)`);
          } else if (addr.town && addr.town === primaryLocation) {
            formattedParts.push(`${primaryLocation} (Town)`);
          } else {
            formattedParts.push(primaryLocation);
          }
        }
        
        // Add district if different from primary and state
        if (district && district !== primaryLocation && district !== state) {
          formattedParts.push(district);
        }
        
        // Add state/province if different
        if (state && state !== primaryLocation && state !== district) {
          formattedParts.push(state);
        }
        
        // Always add country for global clarity
        if (country) {
          formattedParts.push(country);
        }
        
        return {
          neighborhood,
          district,
          city: primaryLocation || 'Unknown Location',
          state,
          country,
          countryCode,
          coordinates: [parseFloat(result.lat), parseFloat(result.lon)] as [number, number],
          formattedAddress: formattedParts.join(', ')
        };
      })
      .filter(location => 
        location.coordinates[0] && 
        location.coordinates[1] && 
        location.city !== 'Unknown Location' &&
        location.formattedAddress.length > 0
      )
      // Remove duplicates based on formatted address (more reliable than coordinates)
      .filter((location, index, self) => 
        index === self.findIndex(l => l.formattedAddress === location.formattedAddress)
      )
      // Secondary dedup by coordinates (for slightly different names of same place)
      .filter((location, index, self) => 
        index === self.findIndex(l => 
          Math.abs(l.coordinates[0] - location.coordinates[0]) < 0.01 &&
          Math.abs(l.coordinates[1] - location.coordinates[1]) < 0.01
        )
      );

    // Cache results (even empty results to avoid repeated failed searches)
    memoryCache.set(cacheKey, {
      results: processedResults,
      timestamp: Date.now()
    });
    saveCache();

    return processedResults;
  } catch (error: any) {
    if (error.message === 'RATE_LIMIT') {
      throw new Error('Too many searches. Please wait a moment and try again.');
    }
    if (error.message === 'NETWORK_ERROR') {
      throw new Error('Network error. Please check your connection and try again.');
    }
    return [];
  }
};

export const geocodeLocation = async (neighborhood?: string, city?: string): Promise<LocationData | null> => {
  if (!city) return null;
  
  const query = neighborhood ? `${neighborhood}, ${city}` : city;
  const results = await searchLocations(query);
  return results[0] || null;
};

// Clear the location cache (useful for debugging)
export const clearLocationCache = () => {
  memoryCache.clear();
  localStorage.removeItem(CACHE_STORAGE_KEY);
};