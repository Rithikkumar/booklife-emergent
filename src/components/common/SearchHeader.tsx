
import React from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchHeaderProps {
  title: string;
  subtitle?: string;
  placeholder: string;
  onSearch?: (query: string) => void;
  icon?: React.ComponentType<any>;
  hideTitle?: boolean;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({
  title,
  subtitle,
  placeholder,
  onSearch,
  icon: Icon = Search,
  hideTitle = false
}) => {
  return (
    <div className="mb-6">
      {!hideTitle && (
        <h2 className="text-2xl font-bold mb-4 flex items-center justify-center">
          <Icon className="h-5 w-5 mr-2 text-primary" />
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="text-muted-foreground mb-4">{subtitle}</p>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder={placeholder}
          className="pl-10 shadow-card focus:shadow-elegant transition-all duration-300"
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>
    </div>
  );
};

export default SearchHeader;
