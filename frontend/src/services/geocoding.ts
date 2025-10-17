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

export const searchLocations = async (query: string): Promise<LocationData[]> => {
  if (query.length < 2) return [];

  try {
    // Try multiple search strategies for better coverage
    const searchQueries = [
      query,
      `${query} village`,
      `${query}, India`,
      `${query} village, India`
    ];

    let allResults: NominatimResult[] = [];

    // Try each search query until we get results
    for (const searchQuery of searchQueries) {
      const response = await fetch(
        `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=15&extratags=1&accept-language=en`,
        {
          headers: {
            'User-Agent': 'BookTrackingApp/1.0'
          }
        }
      );

      if (!response.ok) {
        continue; // Try next query
      }

      const results: NominatimResult[] = await response.json();
      if (results.length > 0) {
        allResults = results;
        break; // Found results, stop trying
      }
    }
    
    return allResults
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
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
};

export const geocodeLocation = async (neighborhood?: string, city?: string): Promise<LocationData | null> => {
  if (!city) return null;
  
  const query = neighborhood ? `${neighborhood}, ${city}` : city;
  const results = await searchLocations(query);
  return results[0] || null;
};