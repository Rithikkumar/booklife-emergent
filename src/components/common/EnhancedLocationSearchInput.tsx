import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Check, Search, AlertCircle, X, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { searchLocations, type LocationData } from '@/services/geocoding';
import { debounce } from '@/utils/debounce';

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
  placeholder = "Search any location worldwide...",
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Direct global search using Nominatim API
  const searchAllLocations = useCallback(async (query: string): Promise<EnhancedLocationData[]> => {
    if (query.length < 2) return [];

    try {
      setErrorMessage(null);
      const results = await searchLocations(query);
      
      return results.map(location => ({
        neighborhood: location.neighborhood,
        district: location.district,
        city: location.city,
        state: location.state,
        country: location.country,
        countryCode: location.countryCode,
        stateCode: location.stateCode,
        coordinates: location.coordinates,
        formattedAddress: location.formattedAddress
      }));
    } catch (error: any) {
      const errorMsg = error.message || 'Search failed. Please try again.';
      setErrorMessage(errorMsg);
      return [];
    }
  }, []);

  // Debounced search function - 400ms delay for better UX while respecting rate limits
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const results = await searchAllLocations(query);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error searching locations:', error);
        setSuggestions([]);
        setShowSuggestions(true); // Still show dropdown with error/help text
      } finally {
        setIsLoading(false);
      }
    }, 400),
    [searchAllLocations]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    onChange(null, newValue);
    
    // Show dropdown immediately when typing starts
    if (newValue.length >= 2) {
      setShowSuggestions(true);
      setIsLoading(true);
    } else {
      setShowSuggestions(false);
      setIsLoading(false);
      setErrorMessage(null);
    }
    
    // Trigger debounced search
    debouncedSearch(newValue);
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
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const clearInput = () => {
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setErrorMessage(null);
    onChange(null, '');
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  // Get location type badge
  const getLocationBadge = (location: EnhancedLocationData) => {
    if (location.neighborhood) return null;
    if (location.city?.includes('Village') || location.city?.includes('Hamlet')) {
      return <span className="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Village</span>;
    }
    if (location.city?.includes('Town')) {
      return <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">Town</span>;
    }
    return null;
  };

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
            if (suggestions.length > 0 || inputValue.length >= 2) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={cn("pr-10", inputValue && "pr-16")}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
          )}
          {inputValue && !isLoading && (
            <button
              type="button"
              onClick={clearInput}
              className="p-1 hover:bg-muted rounded-full transition-colors"
              title="Clear location"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          <Globe className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-72 overflow-auto">
          {errorMessage && (
            <div className="px-3 py-2 bg-destructive/10 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            </div>
          )}
          
          {isLoading && suggestions.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                <Globe className="h-4 w-4 animate-pulse" />
                <span>Searching worldwide...</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Search any city, town, village, or neighborhood
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              <div className="px-3 py-1.5 bg-muted/50 border-b border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {suggestions.length} location{suggestions.length !== 1 ? 's' : ''} found
                </span>
              </div>
              {suggestions.map((location, index) => (
                <div
                  key={`${location.formattedAddress}-${index}`}
                  ref={el => suggestionRefs.current[index] = el}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    selectedIndex === index && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSuggestionClick(location)}
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-2 flex-wrap">
                        <span className="truncate">
                          {location.neighborhood || location.city}
                        </span>
                        {getLocationBadge(location)}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {location.neighborhood ? 
                          `${location.city}${location.state ? `, ${location.state}` : ''}, ${location.country}` :
                          `${location.state ? `${location.state}, ` : ''}${location.country}`
                        }
                      </div>
                    </div>
                  </div>
                  {selectedIndex === index && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                  )}
                </div>
              ))}
            </>
          ) : (
            inputValue.length >= 2 && !isLoading && (
              <div className="px-3 py-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <Search className="h-4 w-4" />
                  <span className="text-sm font-medium">No locations found</span>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>Try searching with more details:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Add country: "{inputValue}, France"</li>
                    <li>Add region: "{inputValue}, California, USA"</li>
                    <li>Try alternate spelling or official name</li>
                  </ul>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    You can still continue with "<span className="font-medium">{inputValue}</span>" as your location.
                  </p>
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
