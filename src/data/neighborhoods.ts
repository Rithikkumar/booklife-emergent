// Comprehensive neighborhood database for major cities worldwide
export interface NeighborhoodData {
  neighborhood: string;
  city: string;
  state?: string;
  country: string;
  countryCode: string;
  stateCode?: string;
  coordinates: [number, number]; // [lat, lng]
  aliases?: string[]; // Alternative names for better search
}

export const neighborhoods: NeighborhoodData[] = [
  // United States - Major Cities
  
  // Los Angeles, CA
  { neighborhood: "Beverly Hills", city: "Los Angeles", state: "California", country: "United States", countryCode: "US", stateCode: "CA", coordinates: [34.0736, -118.4004], aliases: ["BH", "90210"] },
  { neighborhood: "Hollywood", city: "Los Angeles", state: "California", country: "United States", countryCode: "US", stateCode: "CA", coordinates: [34.0928, -118.3287] },
  { neighborhood: "Santa Monica", city: "Los Angeles", state: "California", country: "United States", countryCode: "US", stateCode: "CA", coordinates: [34.0195, -118.4912] },
  { neighborhood: "Venice", city: "Los Angeles", state: "California", country: "United States", countryCode: "US", stateCode: "CA", coordinates: [34.0522, -118.4818] },
  { neighborhood: "West Hollywood", city: "Los Angeles", state: "California", country: "United States", countryCode: "US", stateCode: "CA", coordinates: [34.0900, -118.3617] },
  { neighborhood: "Malibu", city: "Los Angeles", state: "California", country: "United States", countryCode: "US", stateCode: "CA", coordinates: [34.0259, -118.7798] },
  { neighborhood: "Pasadena", city: "Los Angeles", state: "California", country: "United States", countryCode: "US", stateCode: "CA", coordinates: [34.1478, -118.1445] },
  
  // New York, NY
  { neighborhood: "Manhattan", city: "New York", state: "New York", country: "United States", countryCode: "US", stateCode: "NY", coordinates: [40.7831, -73.9712] },
  { neighborhood: "Brooklyn", city: "New York", state: "New York", country: "United States", countryCode: "US", stateCode: "NY", coordinates: [40.6782, -73.9442] },
  { neighborhood: "Queens", city: "New York", state: "New York", country: "United States", countryCode: "US", stateCode: "NY", coordinates: [40.7282, -73.7949] },
  { neighborhood: "Bronx", city: "New York", state: "New York", country: "United States", countryCode: "US", stateCode: "NY", coordinates: [40.8448, -73.8648] },
  { neighborhood: "Staten Island", city: "New York", state: "New York", country: "United States", countryCode: "US", stateCode: "NY", coordinates: [40.5795, -74.1502] },
  { neighborhood: "Williamsburg", city: "New York", state: "New York", country: "United States", countryCode: "US", stateCode: "NY", coordinates: [40.7081, -73.9571] },
  { neighborhood: "Chelsea", city: "New York", state: "New York", country: "United States", countryCode: "US", stateCode: "NY", coordinates: [40.7465, -74.0014] },
  { neighborhood: "SoHo", city: "New York", state: "New York", country: "United States", countryCode: "US", stateCode: "NY", coordinates: [40.7230, -74.0020] },
  { neighborhood: "Greenwich Village", city: "New York", state: "New York", country: "United States", countryCode: "US", stateCode: "NY", coordinates: [40.7336, -74.0027] },
  { neighborhood: "Upper East Side", city: "New York", state: "New York", country: "United States", countryCode: "US", stateCode: "NY", coordinates: [40.7736, -73.9566] },
  { neighborhood: "Upper West Side", city: "New York", state: "New York", country: "United States", countryCode: "US", stateCode: "NY", coordinates: [40.7870, -73.9754] },
  
  // Chicago, IL
  { neighborhood: "Loop", city: "Chicago", state: "Illinois", country: "United States", countryCode: "US", stateCode: "IL", coordinates: [41.8781, -87.6298] },
  { neighborhood: "Lincoln Park", city: "Chicago", state: "Illinois", country: "United States", countryCode: "US", stateCode: "IL", coordinates: [41.9254, -87.6369] },
  { neighborhood: "Wicker Park", city: "Chicago", state: "Illinois", country: "United States", countryCode: "US", stateCode: "IL", coordinates: [41.9073, -87.6776] },
  { neighborhood: "River North", city: "Chicago", state: "Illinois", country: "United States", countryCode: "US", stateCode: "IL", coordinates: [41.8903, -87.6279] },
  
  // San Francisco, CA
  { neighborhood: "Mission District", city: "San Francisco", state: "California", country: "United States", countryCode: "US", stateCode: "CA", coordinates: [37.7599, -122.4148] },
  { neighborhood: "Castro", city: "San Francisco", state: "California", country: "United States", countryCode: "US", stateCode: "CA", coordinates: [37.7609, -122.4350] },
  { neighborhood: "Haight-Ashbury", city: "San Francisco", state: "California", country: "United States", countryCode: "US", stateCode: "CA", coordinates: [37.7692, -122.4481] },
  { neighborhood: "North Beach", city: "San Francisco", state: "California", country: "United States", countryCode: "US", stateCode: "CA", coordinates: [37.8067, -122.4102] },
  { neighborhood: "Chinatown", city: "San Francisco", state: "California", country: "United States", countryCode: "US", stateCode: "CA", coordinates: [37.7941, -122.4078] },
  
  // Miami, FL
  { neighborhood: "South Beach", city: "Miami", state: "Florida", country: "United States", countryCode: "US", stateCode: "FL", coordinates: [25.7907, -80.1300] },
  { neighborhood: "Wynwood", city: "Miami", state: "Florida", country: "United States", countryCode: "US", stateCode: "FL", coordinates: [25.8011, -80.1994] },
  { neighborhood: "Little Havana", city: "Miami", state: "Florida", country: "United States", countryCode: "US", stateCode: "FL", coordinates: [25.7643, -80.2204] },
  
  // United Kingdom
  
  // London
  { neighborhood: "Westminster", city: "London", country: "United Kingdom", countryCode: "GB", coordinates: [51.4994, -0.1319] },
  { neighborhood: "Camden", city: "London", country: "United Kingdom", countryCode: "GB", coordinates: [51.5392, -0.1426] },
  { neighborhood: "Shoreditch", city: "London", country: "United Kingdom", countryCode: "GB", coordinates: [51.5255, -0.0807] },
  { neighborhood: "Notting Hill", city: "London", country: "United Kingdom", countryCode: "GB", coordinates: [51.5158, -0.2058] },
  { neighborhood: "Covent Garden", city: "London", country: "United Kingdom", countryCode: "GB", coordinates: [51.5118, -0.1226] },
  { neighborhood: "Mayfair", city: "London", country: "United Kingdom", countryCode: "GB", coordinates: [51.5074, -0.1478] },
  { neighborhood: "Greenwich", city: "London", country: "United Kingdom", countryCode: "GB", coordinates: [51.4934, 0.0098] },
  
  // Canada
  
  // Toronto, ON
  { neighborhood: "Downtown Toronto", city: "Toronto", state: "Ontario", country: "Canada", countryCode: "CA", stateCode: "ON", coordinates: [43.6532, -79.3832] },
  { neighborhood: "Kensington Market", city: "Toronto", state: "Ontario", country: "Canada", countryCode: "CA", stateCode: "ON", coordinates: [43.6548, -79.4006] },
  { neighborhood: "Distillery District", city: "Toronto", state: "Ontario", country: "Canada", countryCode: "CA", stateCode: "ON", coordinates: [43.6503, -79.3599] },
  
  // Australia
  
  // Sydney, NSW
  { neighborhood: "Bondi", city: "Sydney", state: "New South Wales", country: "Australia", countryCode: "AU", stateCode: "NSW", coordinates: [-33.8915, 151.2767] },
  { neighborhood: "Surry Hills", city: "Sydney", state: "New South Wales", country: "Australia", countryCode: "AU", stateCode: "NSW", coordinates: [-33.8886, 151.2094] },
  { neighborhood: "Newtown", city: "Sydney", state: "New South Wales", country: "Australia", countryCode: "AU", stateCode: "NSW", coordinates: [-33.8958, 151.1794] },
  
  // Melbourne, VIC
  { neighborhood: "St Kilda", city: "Melbourne", state: "Victoria", country: "Australia", countryCode: "AU", stateCode: "VIC", coordinates: [-37.8676, 144.9612] },
  { neighborhood: "Fitzroy", city: "Melbourne", state: "Victoria", country: "Australia", countryCode: "AU", stateCode: "VIC", coordinates: [-37.7982, 144.9784] },
  
  // India
  
  // Mumbai, Maharashtra
  { neighborhood: "Bandra", city: "Mumbai", state: "Maharashtra", country: "India", countryCode: "IN", coordinates: [19.0596, 72.8295] },
  { neighborhood: "Juhu", city: "Mumbai", state: "Maharashtra", country: "India", countryCode: "IN", coordinates: [19.1075, 72.8263] },
  { neighborhood: "Andheri", city: "Mumbai", state: "Maharashtra", country: "India", countryCode: "IN", coordinates: [19.1136, 72.8697] },
  
  // Delhi
  { neighborhood: "Connaught Place", city: "New Delhi", state: "Delhi", country: "India", countryCode: "IN", coordinates: [28.6315, 77.2167] },
  { neighborhood: "Khan Market", city: "New Delhi", state: "Delhi", country: "India", countryCode: "IN", coordinates: [28.5983, 77.2319] },
  { neighborhood: "Hauz Khas", city: "New Delhi", state: "Delhi", country: "India", countryCode: "IN", coordinates: [28.5494, 77.2001] },
  
  // Bangalore, Karnataka
  { neighborhood: "Koramangala", city: "Bangalore", state: "Karnataka", country: "India", countryCode: "IN", coordinates: [12.9352, 77.6245] },
  { neighborhood: "Indiranagar", city: "Bangalore", state: "Karnataka", country: "India", countryCode: "IN", coordinates: [12.9719, 77.6412] },
  { neighborhood: "Whitefield", city: "Bangalore", state: "Karnataka", country: "India", countryCode: "IN", coordinates: [12.9698, 77.7499] },
  
  // Hyderabad, Telangana
  { neighborhood: "HITEC City", city: "Hyderabad", state: "Telangana", country: "India", countryCode: "IN", coordinates: [17.4435, 78.3772] },
  { neighborhood: "Banjara Hills", city: "Hyderabad", state: "Telangana", country: "India", countryCode: "IN", coordinates: [17.4239, 78.4738] },
  { neighborhood: "Jubilee Hills", city: "Hyderabad", state: "Telangana", country: "India", countryCode: "IN", coordinates: [17.4274, 78.4067] },
  
  // Warangal, Telangana (as mentioned by user)
  { neighborhood: "ABC", city: "Warangal", state: "Telangana", country: "India", countryCode: "IN", coordinates: [17.9689, 79.5941] },
  
  // Other Major Cities
  
  // Paris, France
  { neighborhood: "Montmartre", city: "Paris", country: "France", countryCode: "FR", coordinates: [48.8867, 2.3431] },
  { neighborhood: "Le Marais", city: "Paris", country: "France", countryCode: "FR", coordinates: [48.8566, 2.3522] },
  { neighborhood: "Saint-Germain", city: "Paris", country: "France", countryCode: "FR", coordinates: [48.8546, 2.3376] },
  
  // Berlin, Germany
  { neighborhood: "Mitte", city: "Berlin", country: "Germany", countryCode: "DE", coordinates: [52.5200, 13.4050] },
  { neighborhood: "Kreuzberg", city: "Berlin", country: "Germany", countryCode: "DE", coordinates: [52.4988, 13.3889] },
  { neighborhood: "Prenzlauer Berg", city: "Berlin", country: "Germany", countryCode: "DE", coordinates: [52.5482, 13.4039] },
  
  // Tokyo, Japan
  { neighborhood: "Shibuya", city: "Tokyo", country: "Japan", countryCode: "JP", coordinates: [35.6598, 139.7006] },
  { neighborhood: "Harajuku", city: "Tokyo", country: "Japan", countryCode: "JP", coordinates: [35.6702, 139.7026] },
  { neighborhood: "Shinjuku", city: "Tokyo", country: "Japan", countryCode: "JP", coordinates: [35.6938, 139.7034] },
];

// Create search index for faster lookups
export const createSearchIndex = () => {
  const index: { [key: string]: NeighborhoodData[] } = {};
  
  neighborhoods.forEach(neighborhood => {
    // Index by neighborhood name
    const nameKey = neighborhood.neighborhood.toLowerCase();
    if (!index[nameKey]) index[nameKey] = [];
    index[nameKey].push(neighborhood);
    
    // Index by aliases
    neighborhood.aliases?.forEach(alias => {
      const aliasKey = alias.toLowerCase();
      if (!index[aliasKey]) index[aliasKey] = [];
      index[aliasKey].push(neighborhood);
    });
    
    // Index by partial matches (for autocomplete)
    for (let i = 2; i <= neighborhood.neighborhood.length; i++) {
      const partial = neighborhood.neighborhood.substring(0, i).toLowerCase();
      if (!index[partial]) index[partial] = [];
      if (!index[partial].includes(neighborhood)) {
        index[partial].push(neighborhood);
      }
    }
  });
  
  return index;
};
