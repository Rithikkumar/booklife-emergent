import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

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
        // Include country from formatted_address which is stored during registration
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

        // Convert to journey points - only include entries with valid coordinates
        const points: JourneyPoint[] = bookInstances
          .filter(instance => {
            // Only include if we have valid coordinates from the database
            return instance.latitude && instance.longitude && 
                   !isNaN(instance.latitude) && !isNaN(instance.longitude);
          })
          .map((instance) => {
            const coordinates: [number, number] = [instance.latitude!, instance.longitude!];
            const profile = profiles?.find(p => p.user_id === instance.user_id);
            
            // Extract country from formatted_address (last part after comma)
            const country = extractCountryFromAddress(instance.formatted_address);
            
            // Create formatted location from available data
            const formattedLocation = instance.formatted_address || 
              [instance.neighborhood, instance.city].filter(Boolean).join(', ') || 
              instance.city || 
              'Unknown Location';
            
            return {
              neighborhood: instance.neighborhood || undefined,
              district: instance.district || undefined,
              city: instance.city || 'Unknown',
              country,
              coordinates,
              date: instance.created_at,
              owner: {
                username: profile?.username || 'unknown',
                displayName: profile?.display_name || 'Unknown User'
              },
              formattedLocation
            };
          });

        setJourneyPoints(points);
      } catch (err) {
        logger.error('Error fetching journey points:', err);
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

/**
 * Extract country from a formatted address string
 * Formatted addresses typically end with the country name
 * e.g., "Brooklyn, New York, USA" -> "USA"
 * e.g., "Shibuya, Tokyo, Japan" -> "Japan"
 */
const extractCountryFromAddress = (formattedAddress?: string | null): string => {
  if (!formattedAddress) return 'Unknown';
  
  const parts = formattedAddress.split(',').map(part => part.trim());
  
  if (parts.length === 0) return 'Unknown';
  
  // The country is typically the last part
  const lastPart = parts[parts.length - 1];
  
  // Handle common variations
  if (lastPart && lastPart.length > 0) {
    return lastPart;
  }
  
  return 'Unknown';
};
