import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface JourneyPoint {
  neighborhood?: string;
  district?: string;
  city: string;
  country: string;
  coordinates: [number, number];
  date: string;
  owner: {
    username: string;
    displayName: string;
  };
  formattedLocation: string;
}

// City coordinates mapping
const CITY_COORDINATES: Record<string, [number, number]> = {
  'London': [51.5074, -0.1278],
  'Paris': [48.8566, 2.3522],
  'Madrid': [40.4168, -3.7038],
  'Berlin': [52.5200, 13.4050],
  'Prague': [50.0755, 14.4378],
  'New York': [40.7128, -74.0060],
  'Los Angeles': [34.0522, -118.2437],
  'Chicago': [41.8781, -87.6298],
  'Toronto': [43.6532, -79.3832],
  'Sydney': [-33.8688, 151.2093],
  'Tokyo': [35.6762, 139.6503],
  'Beijing': [39.9042, 116.4074],
  'Mumbai': [19.0760, 72.8777],
  'Istanbul': [41.0082, 28.9784],
  'Cairo': [30.0444, 31.2357],
  'Rio de Janeiro': [-22.9068, -43.1729],
  'Buenos Aires': [-34.6118, -58.3960],
  'Mexico City': [19.4326, -99.1332],
  'Rome': [41.9028, 12.4964],
  'Amsterdam': [52.3676, 4.9041],
  'Vienna': [48.2082, 16.3738],
  'Stockholm': [59.3293, 18.0686],
  'Copenhagen': [55.6761, 12.5683],
  'Oslo': [59.9139, 10.7522],
  'Helsinki': [60.1699, 24.9384],
  'Warsaw': [52.2297, 21.0122],
  'Lisbon': [38.7223, -9.1393],
  'Barcelona': [41.3851, 2.1734],
  'Milan': [45.4642, 9.1900],
  'Zurich': [47.3769, 8.5417],
  'Geneva': [46.2044, 6.1432],
  'Monaco': [43.7384, 7.4246],
  'Dublin': [53.3498, -6.2603],
  'Edinburgh': [55.9533, -3.1883],
  'Glasgow': [55.8642, -4.2518],
  'Manchester': [53.4808, -2.2426],
  'Liverpool': [53.4084, -2.9916],
  'Brussels': [50.8503, 4.3517],
  'Antwerp': [51.2194, 4.4025],
  'The Hague': [52.0705, 4.3007],
  'Rotterdam': [51.9244, 4.4777],
  'Florence': [43.7696, 11.2558],
  'Venice': [45.4408, 12.3155],
  'Naples': [40.8518, 14.2681],
  'Athens': [37.9838, 23.7275],
  'Budapest': [47.4979, 19.0402],
  'Krakow': [50.0647, 19.9450],
  'Moscow': [55.7558, 37.6176],
  'St. Petersburg': [59.9311, 30.3609],
  'Kiev': [50.4501, 30.5234],
  'Bucharest': [44.4268, 26.1025],
  'Sofia': [42.6977, 23.3219],
  'Belgrade': [44.7866, 20.4489],
  'Zagreb': [45.8150, 15.9819],
  'Ljubljana': [46.0569, 14.5058],
  'Bratislava': [48.1486, 17.1077],
  'Tallinn': [59.4370, 24.7536],
  'Riga': [56.9496, 24.1052],
  'Vilnius': [54.6872, 25.2797],
  'Minsk': [53.9045, 27.5615],
  'Unknown': [0, 0]
};

const getCoordinates = (city: string): [number, number] => {
  if (!city || city === 'Unknown') return [25.0000, 0.0000]; // Better fallback than [0,0]
  
  // Direct lookup
  if (CITY_COORDINATES[city]) {
    return CITY_COORDINATES[city];
  }
  
  // Case-insensitive lookup
  const normalizedCity = city.trim();
  const foundKey = Object.keys(CITY_COORDINATES).find(
    key => key.toLowerCase() === normalizedCity.toLowerCase()
  );
  
  if (foundKey) {
    return CITY_COORDINATES[foundKey];
  }
  
  // Special cases for fictional/desert locations with meaningful coordinates
  const specialLocations: Record<string, [number, number]> = {
    'sahara desert': [23.4162, 25.6628],
    'arrakis': [23.4162, 25.6628], // Use desert coordinates
    'unknown desert planet': [23.4162, 25.6628],
    'fictional': [25.0000, 0.0000],
  };
  
  const specialKey = Object.keys(specialLocations).find(
    key => normalizedCity.toLowerCase().includes(key)
  );
  
  if (specialKey) {
    return specialLocations[specialKey];
  }
  
  // Default fallback - use equatorial coordinates instead of [0,0]
  return [25.0000, 0.0000];
};

export const useBookJourney = (bookTitle?: string, bookAuthor?: string) => {
  const [journeyPoints, setJourneyPoints] = useState<JourneyPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJourneyPoints = async () => {
      if (!bookTitle || !bookAuthor) {
        setJourneyPoints([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch all instances of this book from different users
        const { data: bookInstances, error: bookError } = await supabase
          .from('user_books')
          .select(`
            neighborhood,
            district,
            city,
            formatted_address,
            latitude,
            longitude,
            created_at,
            user_id
          `)
          .eq('title', bookTitle)
          .eq('author', bookAuthor)
          .not('city', 'is', null)
          .order('created_at', { ascending: true });

        if (bookError) throw bookError;

        if (!bookInstances || bookInstances.length === 0) {
          setJourneyPoints([]);
          return;
        }

        // Fetch profiles separately
        const userIds = bookInstances.map(instance => instance.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, display_name')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Convert to journey points
        const points: JourneyPoint[] = bookInstances.map((instance, index) => {
          // Use database coordinates if available, otherwise fallback to hardcoded lookup
          let coordinates: [number, number];
          if (instance.latitude && instance.longitude) {
            coordinates = [instance.latitude, instance.longitude];
          } else {
            coordinates = getCoordinates(instance.city || 'Unknown');
          }
          
          const profile = profiles?.find(p => p.user_id === instance.user_id);
          
          // Create formatted location with neighborhood priority
          const formatLocation = () => {
            if (instance.formatted_address) return instance.formatted_address;
            
            const parts = [];
            if (instance.neighborhood) parts.push(instance.neighborhood);
            if (instance.city && instance.city !== instance.neighborhood) parts.push(instance.city);
            const country = getCountryFromCity(instance.city || 'Unknown');
            if (country !== 'Unknown') parts.push(country);
            
            return parts.join(', ') || instance.city || 'Unknown';
          };
          
          return {
            neighborhood: instance.neighborhood,
            district: instance.district,
            city: instance.city || 'Unknown',
            country: getCountryFromCity(instance.city || 'Unknown'),
            coordinates,
            date: instance.created_at,
            owner: {
              username: profile?.username || 'unknown',
              displayName: profile?.display_name || 'Unknown User'
            },
            formattedLocation: formatLocation()
          };
        }); // Remove filtering - show all points even with [0,0] coordinates

        setJourneyPoints(points);
      } catch (err) {
        console.error('Error fetching journey points:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch journey data');
        setJourneyPoints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJourneyPoints();
  }, [bookTitle, bookAuthor]);

  return { journeyPoints, loading, error };
};

// Helper function to get country from city
const getCountryFromCity = (city: string): string => {
  const cityToCountry: Record<string, string> = {
    'London': 'UK',
    'Paris': 'France',
    'Madrid': 'Spain',
    'Berlin': 'Germany',
    'Prague': 'Czech Republic',
    'New York': 'USA',
    'Los Angeles': 'USA',
    'Chicago': 'USA',
    'Toronto': 'Canada',
    'Sydney': 'Australia',
    'Tokyo': 'Japan',
    'Beijing': 'China',
    'Mumbai': 'India',
    'Istanbul': 'Turkey',
    'Cairo': 'Egypt',
    'Rio de Janeiro': 'Brazil',
    'Buenos Aires': 'Argentina',
    'Mexico City': 'Mexico',
    'Rome': 'Italy',
    'Amsterdam': 'Netherlands',
    'Vienna': 'Austria',
    'Stockholm': 'Sweden',
    'Copenhagen': 'Denmark',
    'Oslo': 'Norway',
    'Helsinki': 'Finland',
    'Warsaw': 'Poland',
    'Lisbon': 'Portugal',
    'Barcelona': 'Spain',
    'Milan': 'Italy',
    'Zurich': 'Switzerland',
    'Geneva': 'Switzerland',
    'Monaco': 'Monaco',
    'Dublin': 'Ireland',
    'Edinburgh': 'UK',
    'Glasgow': 'UK',
    'Manchester': 'UK',
    'Liverpool': 'UK',
    'Brussels': 'Belgium',
    'Antwerp': 'Belgium',
    'The Hague': 'Netherlands',
    'Rotterdam': 'Netherlands',
    'Florence': 'Italy',
    'Venice': 'Italy',
    'Naples': 'Italy',
    'Athens': 'Greece',
    'Budapest': 'Hungary',
    'Krakow': 'Poland',
    'Moscow': 'Russia',
    'St. Petersburg': 'Russia',
    'Kiev': 'Ukraine',
    'Bucharest': 'Romania',
    'Sofia': 'Bulgaria',
    'Belgrade': 'Serbia',
    'Zagreb': 'Croatia',
    'Ljubljana': 'Slovenia',
    'Bratislava': 'Slovakia',
    'Tallinn': 'Estonia',
    'Riga': 'Latvia',
    'Vilnius': 'Lithuania',
    'Minsk': 'Belarus'
  };

  return cityToCountry[city] || 'Unknown';
};