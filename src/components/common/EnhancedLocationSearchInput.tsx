import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Check, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { neighborhoods, createSearchIndex, type NeighborhoodData } from '@/data/neighborhoods';
import { searchLocations, type LocationData } from '@/services/geocoding';

export interface EnhancedLocationData {
  neighborhood?: string;
  district?: string;
  city: string;
  state?: string;
  country: string;
  countryCode?: string;
  stateCode?: string;
  coordinates: [number, number]; // [lat, lng]
  formattedAddress: string;
}

interface EnhancedLocationSearchInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange: (location: EnhancedLocationData | null, inputValue: string) => void;
  className?: string;
  required?: boolean;
}

const EnhancedLocationSearchInput: React.FC<EnhancedLocationSearchInputProps> = ({
  label = "Location",
  placeholder = "Search for a neighborhood, city...",
  value = "",
  onChange,
  className,
  required = false,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<EnhancedLocationData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Create search index for neighborhoods (Tier 1: Fast local cache)
  const neighborhoodIndex = useMemo(() => createSearchIndex(), []);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const searchNeighborhoods = (query: string): EnhancedLocationData[] => {
    const lowerQuery = query.toLowerCase();
    const results: EnhancedLocationData[] = [];
    const seen = new Set<string>();

    // Search in neighborhood index (fast local cache)
    for (const key in neighborhoodIndex) {
      if (key.includes(lowerQuery)) {
        neighborhoodIndex[key].forEach(neighborhood => {
          const id = `${neighborhood.neighborhood}-${neighborhood.city}-${neighborhood.country}`;
          if (!seen.has(id)) {
            seen.add(id);
            results.push({
              neighborhood: neighborhood.neighborhood,
              city: neighborhood.city,
              state: neighborhood.state,
              country: neighborhood.country,
              countryCode: neighborhood.countryCode,
              stateCode: neighborhood.stateCode,
              coordinates: neighborhood.coordinates,
              formattedAddress: neighborhood.state 
                ? `${neighborhood.neighborhood}, ${neighborhood.city}, ${neighborhood.state}, ${neighborhood.country}`
                : `${neighborhood.neighborhood}, ${neighborhood.city}, ${neighborhood.country}`
            });
          }
        });
      }
    }

    return results.slice(0, 5); // Limit local results to make room for global ones
  };

  const searchAllLocations = async (query: string): Promise<EnhancedLocationData[]> => {
    if (query.length < 2) return [];

    const allResults: EnhancedLocationData[] = [];
    const seen = new Set<string>();

    // Tier 1: Search neighborhoods first (instant, local cache)
    const neighborhoodResults = searchNeighborhoods(query);
    neighborhoodResults.forEach(result => {
      if (!seen.has(result.formattedAddress)) {
        seen.add(result.formattedAddress);
        allResults.push(result);
      }
    });
    
    // Tier 2: Global search using Nominatim API (for any place worldwide)
    try {
      const globalResults = await searchLocations(query);
      globalResults.forEach(location => {
        if (!seen.has(location.formattedAddress)) {
          seen.add(location.formattedAddress);
          allResults.push({
            neighborhood: location.neighborhood,
            district: location.district,
            city: location.city,
            state: location.state,
            country: location.country,
            countryCode: location.countryCode,
            stateCode: location.stateCode,
            coordinates: location.coordinates,
            formattedAddress: location.formattedAddress
          });
        }
      });
    } catch (error) {
      console.error('Global location search failed:', error);
    }

    return allResults.slice(0, 10); // Limit total results
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    onChange(null, newValue);
    
    if (newValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const results = await searchAllLocations(newValue);
      setSuggestions(results);
      setShowSuggestions(results.length > 0 || newValue.length >= 2);
    } catch (error) {
      console.error('Error searching locations:', error);
      setSuggestions([]);
      setShowSuggestions(newValue.length >= 2); // Still show manual entry option
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (location: EnhancedLocationData) => {
    setInputValue(location.formattedAddress);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onChange(location, location.formattedAddress);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150);
  };

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  return (
    <div className={cn("relative", className)}>
      {label && (
        <Label htmlFor="enhanced-location-search" className="mb-2 block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          ref={inputRef}
          id="enhanced-location-search"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="pr-10"
          autoComplete="off"
        />
        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {isLoading && (
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.length > 0 ? (
            suggestions.map((location, index) => (
              <div
                key={`${location.formattedAddress}-${index}`}
                ref={el => suggestionRefs.current[index] = el}
                className={cn(
                  "flex items-center justify-between px-3 py-2 cursor-pointer transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  selectedIndex === index && "bg-accent text-accent-foreground"
                )}
                onClick={() => handleSuggestionClick(location)}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {location.neighborhood ? location.neighborhood : location.city}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {location.neighborhood ? 
                        `${location.city}${location.district ? `, ${location.district}` : ''}${location.state ? `, ${location.state}` : ''}, ${location.country}` :
                        `${location.district && location.district !== location.city ? `${location.district}, ` : ''}${location.state ? `${location.state}, ` : ''}${location.country}`
                      }
                    </div>
                  </div>
                </div>
                {selectedIndex === index && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            ))
          ) : (
            inputValue.length >= 2 && !isLoading && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="h-4 w-4" />
                  <span>No locations found</span>
                </div>
                <div className="text-xs mb-2">
                  Your location is not in our database, but you can still continue with manual entry.
                </div>
                <div className="text-xs text-primary">
                  💡 Try: "{inputValue} village" or "{inputValue}, [State/Province], [Country]"
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedLocationSearchInput;