import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Book, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookSearchResult {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
}

interface BookData {
  title: string;
  author: string;
  coverUrl?: string;
}

interface BookSearchInputProps {
  label?: string;
  placeholder?: string;
  onBookSelect: (book: BookData) => void;
  initialTitle?: string;
  initialAuthor?: string;
  className?: string;
  showAuthorField?: boolean;
  required?: boolean;
}

const BookSearchInput: React.FC<BookSearchInputProps> = ({
  label = "Book Search",
  placeholder = "Search for a book...",
  onBookSelect,
  initialTitle = "",
  initialAuthor = "",
  className,
  showAuthorField = true,
  required = false
}) => {
  const [searchQuery, setSearchQuery] = useState(initialTitle);
  const [authorInput, setAuthorInput] = useState(initialAuthor);
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookData | null>(
    initialTitle ? { title: initialTitle, author: initialAuthor } : null
  );
  
  const searchTimeout = useRef<NodeJS.Timeout>();
  const resultsRef = useRef<HTMLDivElement>(null);

  // Search OpenLibrary API
  const searchBooks = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=8&fields=key,title,author_name,cover_i,first_publish_year`
      );
      const data = await response.json();
      setSearchResults(data.docs || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching books:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      if (searchQuery && !selectedBook) {
        searchBooks(searchQuery);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, selectedBook]);

  // Handle book selection from results
  const handleBookSelect = (book: BookSearchResult) => {
    const bookData: BookData = {
      title: book.title,
      author: book.author_name?.[0] || '',
      coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : undefined
    };

    setSelectedBook(bookData);
    setSearchQuery(book.title);
    setAuthorInput(book.author_name?.[0] || '');
    setShowResults(false);
    onBookSelect(bookData);
  };

  // Handle manual book entry
  const handleManualEntry = () => {
    if (searchQuery.trim()) {
      const bookData: BookData = {
        title: searchQuery.trim(),
        author: authorInput.trim()
      };
      setSelectedBook(bookData);
      setShowResults(false);
      onBookSelect(bookData);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedBook(null);
    setSearchQuery("");
    setAuthorInput("");
    setSearchResults([]);
    setShowResults(false);
    onBookSelect({ title: "", author: "" });
  };

  // Handle input change
  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    if (selectedBook) {
      setSelectedBook(null);
    }
  };

  // Handle author change
  const handleAuthorChange = (value: string) => {
    setAuthorInput(value);
    if (selectedBook) {
      setSelectedBook({ ...selectedBook, author: value });
      onBookSelect({ ...selectedBook, author: value });
    }
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {label && <Label className="text-sm font-medium">{label}</Label>}
      
      <div className="relative" ref={resultsRef}>
        {/* Selected Book Display */}
        {selectedBook && (
          <Card className="mb-4 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedBook.coverUrl && (
                    <img 
                      src={selectedBook.coverUrl} 
                      alt={selectedBook.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <h4 className="font-medium text-sm">{selectedBook.title}</h4>
                    {selectedBook.author && (
                      <p className="text-xs text-muted-foreground">by {selectedBook.author}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Input */}
        {!selectedBook && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                className="pl-10"
                required={required}
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}
            </div>

            {/* Search Results */}
            {showResults && searchResults.length > 0 && (
              <Card className="absolute top-full left-0 right-0 z-50 max-h-80 overflow-y-auto shadow-lg">
                <CardContent className="p-2">
                  {searchResults.map((book, index) => (
                    <div
                      key={`${book.key}-${index}`}
                      className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
                      onClick={() => handleBookSelect(book)}
                    >
                      {book.cover_i && (
                        <img 
                          src={`https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`}
                          alt={book.title}
                          className="w-8 h-10 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{book.title}</p>
                        {book.author_name && (
                          <p className="text-xs text-muted-foreground truncate">
                            by {book.author_name[0]}
                          </p>
                        )}
                        {book.first_publish_year && (
                          <p className="text-xs text-muted-foreground">
                            {book.first_publish_year}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Manual Entry Option */}
            {searchQuery && searchResults.length === 0 && !isLoading && (
              <Card className="absolute top-full left-0 right-0 z-50 shadow-lg">
                <CardContent className="p-4">
                  <div className="text-center">
                    <Book className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">
                      No books found. Enter manually?
                    </p>
                    <Button 
                      onClick={handleManualEntry}
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      Use "{searchQuery}" manually
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Author Input (when book is selected or for manual entry) */}
        {showAuthorField && (selectedBook || searchQuery) && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              <User className="h-4 w-4 mr-1" />
              Author
            </Label>
            <Input
              placeholder="Author name"
              value={authorInput}
              onChange={(e) => handleAuthorChange(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BookSearchInput;