import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  profile_picture_url: string | null;
}

interface UserSearchInputProps {
  className?: string;
  onUserSelect?: (userId: string) => void;
}

const UserSearchInput: React.FC<UserSearchInputProps> = ({ className = "", onUserSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const searchUsers = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, display_name, profile_picture_url')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(8);

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim()) {
        searchUsers(query);
        setShowResults(true);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < results.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleUserSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleUserSelect = (user: UserProfile) => {
    setQuery("");
    setShowResults(false);
    setSelectedIndex(-1);
    
    if (onUserSelect) {
      onUserSelect(user.user_id);
    } else {
      navigate(`/profile/${user.username}`);
    }
  };

  const getUserInitials = (user: UserProfile) => {
    if (user.display_name) {
      return user.display_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search users..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setShowResults(true)}
          className="pl-10 bg-background/60 border-border/50 focus:bg-background focus:border-border transition-all duration-200"
        />
      </div>

      {showResults && (query.trim().length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-elegant z-50 max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="p-3 text-center text-muted-foreground text-sm">
              Searching...
            </div>
          )}
          
          {!isLoading && results.length === 0 && (
            <div className="p-3 text-center text-muted-foreground text-sm">
              No users found
            </div>
          )}
          
          {!isLoading && results.length > 0 && (
            <div className="py-1">
              {results.map((user, index) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={`w-full px-3 py-2 flex items-center space-x-3 hover:bg-accent/50 transition-colors duration-150 text-left ${
                    index === selectedIndex ? 'bg-accent/50' : ''
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profile_picture_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {user.display_name || user.username}
                    </div>
                    {user.display_name && (
                      <div className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearchInput;