import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CityData {
  name: string;
  state?: string;
  country: string;
  fullName: string;
  countryCode: string;
  stateCode?: string;
  latitude?: number;
  longitude?: number;
}

interface CitySearchInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange: (city: CityData | null, inputValue: string) => void;
  className?: string;
  required?: boolean;
}

const CitySearchInput: React.FC<CitySearchInputProps> = ({
  label = "Location",
  placeholder = "Enter your city...",
  value = "",
  onChange,
  className,
  required = false,
}) => {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Create a simple city data object from the input
    const cityData: CityData = {
      name: newValue,
      country: '',
      fullName: newValue,
      countryCode: '',
    };
    
    onChange(newValue ? cityData : null, newValue);
  };

  return (
    <div className={cn("relative", className)}>
      {label && (
        <Label htmlFor="city-search" className="mb-2 block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          id="city-search"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pr-10"
          autoComplete="off"
        />
        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};

export default CitySearchInput;