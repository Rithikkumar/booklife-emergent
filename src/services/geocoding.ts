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

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    neighbourhood?: string;
    suburb?: string;
    district?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
    state_district?: string;
    municipality?: string;
    hamlet?: string;
  };
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests (Nominatim policy)
let lastRequestTime = 0;

// Simple in-memory cache for recent searches
const searchCache = new Map<string, { results: LocationData[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  
  console.log('🌐 Geocoding API called for:', query);

  // Check cache first
  const cacheKey = query.toLowerCase().trim();
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('✅ Cache hit for:', query, '- returning', cached.results.length, 'results');
    return cached.results;
  }

  try {
    // Wait for rate limiting
    await waitForRateLimit();
    console.log('⏳ Rate limit wait complete, making API request...');

    // Try primary search first
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=15&extratags=1&accept-language=en`
    );

    if (!response.ok) {
      console.error('❌ API response not OK:', response.status, response.statusText);
      if (response.status === 429) {
        throw new Error('RATE_LIMIT');
      }
      throw new Error('NETWORK_ERROR');
    }
    
    console.log('✅ API response received successfully');

    let allResults: NominatimResult[] = await response.json();

    // Only try fallback strategies if primary search returns no results
    if (allResults.length === 0) {
      const fallbackQueries = [
        `${query}, India`,
        `${query} village, India`
      ];

      for (const fallbackQuery of fallbackQueries) {
        await waitForRateLimit(); // Rate limit between fallback attempts
        
        const fallbackResponse = await fetch(
          `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(fallbackQuery)}&format=json&addressdetails=1&limit=10&extratags=1&accept-language=en`
        );

        if (fallbackResponse.ok) {
          const results: NominatimResult[] = await fallbackResponse.json();
          if (results.length > 0) {
            allResults = results;
            break;
          }
        }
      }
    }
    
    const processedResults = allResults
      .filter(result => result.address)
      .map(result => {
        const addr = result.address!;
        
        // Extract location components with priority order - be more inclusive for villages
        const neighborhood = addr.neighbourhood || addr.suburb || addr.hamlet;
        const city = addr.city || addr.town || addr.village || addr.municipality;
        const district = addr.district || addr.county || addr.state_district;
        const state = addr.state;
        const country = addr.country || '';
        const countryCode = addr.country_code?.toUpperCase();
        
        // For villages and small places, be more flexible with what we consider a valid location
        const primaryLocation = city || neighborhood || district;
        
        // Create proper formatted address with administrative hierarchy
        let formattedParts = [];
        
        // Add the most specific location first
        if (primaryLocation) {
          formattedParts.push(primaryLocation);
          
          // Add village designation if it's clearly a village
          if (addr.village && addr.village === primaryLocation) {
            formattedParts[0] = `${primaryLocation} (Village)`;
          }
        }
        
        // Add district if it's different from the primary location
        if (district && district !== primaryLocation && district !== state) {
          formattedParts.push(`${district} District`);
        }
        
        if (state && state !== primaryLocation && state !== district) {
          formattedParts.push(state);
        }
        
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
          stateCode: addr.country_code === 'in' ? state?.split(' ').map(w => w[0]).join('') : undefined,
          coordinates: [parseFloat(result.lat), parseFloat(result.lon)] as [number, number],
          formattedAddress: formattedParts.join(', ')
        };
      })
      .filter(location => 
        location.coordinates[0] && 
        location.coordinates[1] && 
        location.city !== 'Unknown Location'
      )
      // Remove duplicates based on coordinates
      .filter((location, index, self) => 
        index === self.findIndex(l => 
          Math.abs(l.coordinates[0] - location.coordinates[0]) < 0.001 &&
          Math.abs(l.coordinates[1] - location.coordinates[1]) < 0.001
        )
      );

    // Cache successful results
    if (processedResults.length > 0) {
      console.log('💾 Caching', processedResults.length, 'results for:', query);
      searchCache.set(cacheKey, {
        results: processedResults,
        timestamp: Date.now()
      });
    } else {
      console.log('⚠️ No results to cache for:', query);
    }

    return processedResults;
  } catch (error: any) {
    console.error('❌ Geocoding error:', error);
    
    // Throw specific errors for better handling
    if (error.message === 'RATE_LIMIT') {
      console.error('🚫 Rate limit hit');
      throw new Error('Too many searches. Please wait a moment and try again.');
    }
    if (error.message === 'NETWORK_ERROR') {
      console.error('🌐 Network error detected');
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    console.error('⚠️ Unknown error, returning empty results');
    return [];
  }
};

export const geocodeLocation = async (neighborhood?: string, city?: string): Promise<LocationData | null> => {
  if (!city) return null;
  
  const query = neighborhood ? `${neighborhood}, ${city}` : city;
  const results = await searchLocations(query);
  return results[0] || null;
};