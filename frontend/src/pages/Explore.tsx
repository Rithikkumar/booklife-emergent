import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Globe, BookOpen, Heart, MessageCircle, Share, Loader2, ChevronDown, Filter, Check } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useBookFiltering, FilterType } from "@/hooks/useBookFiltering";
import { useRecentStories } from "@/hooks/useRecentStories";
import { useFollowingBooks } from '@/hooks/useFollowingBooks';
import { useTotalBooksCount } from '@/hooks/useTotalBooksCount';
import { cn, formatGenreLabel } from "@/lib/utils";
import { BookCover } from "@/utils/bookCovers";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ScrollRestoreLayout from "@/components/common/ScrollRestoreLayout";

const Explore = () => {
  const { 
    books, 
    loading, 
    activeFilters, 
    searchQuery, 
    error,
    handleFilterToggle, 
    handleSearch, 
    clearFilters 
  } = useBookFiltering();
  const { isBookFollowed, toggleFollow } = useFollowingBooks();
  const { totalCount, loading: countLoading } = useTotalBooksCount();

  const { stories: recentStories, loading: storiesLoading } = useRecentStories();
  const location = useLocation();

  const scrollKey = `explore:${[...activeFilters].sort().join(',')}|q:${searchQuery || ''}`;

  const mainFilterOptions = [
    { key: 'trending' as FilterType, label: 'Trending', icon: TrendingUp },
    { key: 'global-journey' as FilterType, label: 'Global Journey', icon: Globe },
    { key: 'fiction' as FilterType, label: 'Fiction', icon: null },
    { key: 'non-fiction' as FilterType, label: 'Non-Fiction', icon: null },
    { key: 'mystery' as FilterType, label: 'Mystery', icon: null },
    { key: 'romance' as FilterType, label: 'Romance', icon: null },
    { key: 'science-fiction' as FilterType, label: 'Sci-Fi', icon: null },
    { key: 'fantasy' as FilterType, label: 'Fantasy', icon: null },
  ];

  const moreFilterOptions = [
    { key: 'thriller' as FilterType, label: 'Thriller', icon: null },
    { key: 'historical-fiction' as FilterType, label: 'Historical Fiction', icon: null },
    { key: 'biography' as FilterType, label: 'Biography', icon: null },
    { key: 'self-help' as FilterType, label: 'Self Help', icon: null },
    { key: 'young-adult' as FilterType, label: 'Young Adult', icon: null },
    { key: 'children' as FilterType, label: 'Children', icon: null },
    { key: 'horror' as FilterType, label: 'Horror', icon: null },
    { key: 'adventure' as FilterType, label: 'Adventure', icon: null },
    { key: 'poetry' as FilterType, label: 'Poetry', icon: null },
    { key: 'drama' as FilterType, label: 'Drama', icon: null },
    { key: 'philosophy' as FilterType, label: 'Philosophy', icon: null },
    { key: 'psychology' as FilterType, label: 'Psychology', icon: null },
  ];

  const allFilterOptions = [...mainFilterOptions, ...moreFilterOptions];

  const getDisplayTitle = () => {
    if (activeFilters.length > 0) {
      if (activeFilters.length === 1) {
        const filter = allFilterOptions.find(f => f.key === activeFilters[0]);
        return filter ? `${filter.label} Books` : 'Filtered Books';
      }
      return `Filtered Books (${activeFilters.length} filters)`;
    }
    if (searchQuery) {
      return `Search Results for "${searchQuery}"`;
    }
    return 'All Books';
  };

  const getDisplayIconComponent = () => {
    if (activeFilters.length === 1) {
      const filter = allFilterOptions.find(f => f.key === activeFilters[0]);
      if (filter?.icon) {
        const IconComponent = filter.icon;
        return <IconComponent className="h-5 w-5 mr-2 text-primary" />;
      }
      return <BookOpen className="h-5 w-5 mr-2 text-primary" />;
    }
    return searchQuery ? 
      <Search className="h-5 w-5 mr-2 text-primary" /> : 
      <BookOpen className="h-5 w-5 mr-2 text-primary" />;
  };

  return (
    <ScrollRestoreLayout className="min-h-screen bg-background" scrollKey={scrollKey} ready={!loading}>
      
      <div className="pt-4 pb-12">
        <div className="container mx-auto px-1 sm:px-3 lg:px-4 max-w-7xl w-full">
          {/* Header */}
          <div className="text-center mb-8 lg:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Explore Book Life
            </h1>
            <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto">
              Discover trending books, follow their journeys, and explore stories from readers around the world
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8 lg:mb-12">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/70 h-5 w-5 z-10" />
              <Input
                placeholder="Search by book title, author, genre, or topic..."
                className="pl-10 h-12 border-2 border-border/60 focus:border-primary/50 bg-background/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 w-full"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Multi-Select Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-8 lg:mb-12">
            {mainFilterOptions.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilters.includes(filter.key);
              
              return (
                <Badge 
                  key={filter.key}
                  variant={isActive ? "secondary" : "outline"} 
                  className={cn(
                    "cursor-pointer transition-all duration-200 relative",
                    isActive 
                      ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105" 
                      : "hover:bg-primary/10 hover:border-primary hover:text-primary"
                  )}
                  onClick={() => handleFilterToggle(filter.key)}
                >
                  {Icon && <Icon className="h-3 w-3 mr-1" />}
                  {filter.label}
                  {isActive && <span className="ml-1 text-xs">✓</span>}
                </Badge>
              );
            })}

            {/* Show active filters from More Filters dropdown */}
            {moreFilterOptions
              .filter(filter => activeFilters.includes(filter.key))
              .map((filter) => (
                <Badge 
                  key={filter.key}
                  variant="secondary"
                  className="cursor-pointer transition-all duration-200 relative bg-primary text-primary-foreground border-primary shadow-lg scale-105"
                  onClick={() => handleFilterToggle(filter.key)}
                >
                  {filter.label}
                  <span className="ml-1 text-xs">✓</span>
                </Badge>
              ))}
            
            {/* More Filters Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  className="rounded-full h-7 px-3 cursor-pointer hover:bg-primary/10 hover:border-primary hover:text-primary transition-all duration-200"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  More Filters
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="bottom" 
                align="end" 
                sideOffset={8} 
                className="bg-popover text-popover-foreground border border-border shadow-elegant z-[100] w-48 max-h-64 overflow-y-auto"
              >
                {moreFilterOptions.map((filter) => {
                  const isActive = activeFilters.includes(filter.key);
                  
                  return (
                    <DropdownMenuItem
                      key={filter.key}
                      onClick={() => handleFilterToggle(filter.key)}
                      className={cn(
                        "cursor-pointer",
                        isActive && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      {filter.label}
                      {isActive && <span className="ml-auto text-xs">✓</span>}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {(activeFilters.length > 0 || searchQuery) && (
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground border-destructive text-destructive transition-all"
                onClick={clearFilters}
              >
                Clear All {activeFilters.length > 0 && `(${activeFilters.length})`}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
            {/* Filtered Books - Full width on mobile/tablet, 3/4 on desktop */}
            <div className="xl:col-span-3 w-full min-w-0">
              <div className="flex flex-col items-center mb-6 gap-3">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center">
                  {getDisplayIconComponent()}
                  {getDisplayTitle()}
                </h2>
                <div className="flex items-center gap-4">
                  {!countLoading && totalCount > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {totalCount} total book{totalCount !== 1 ? 's' : ''} in our library
                    </span>
                  )}
                  {activeFilters.includes('trending') && books.length > 0 && (
                    <Badge variant="secondary" className="text-xs bg-gradient-primary text-primary-foreground">
                      🔥 Top {Math.min(books.length, 50)} Trending
                    </Badge>
                  )}
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading books...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <Card className="p-6 border-destructive">
                  <p className="text-destructive">Error: {error}</p>
                  <Button 
                    variant="outline" 
                    className="mt-3"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </Card>
              )}

              {/* No Results State */}
              {!loading && !error && books.length === 0 && (
                <Card className="p-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No books found</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeFilters.length > 0 || searchQuery 
                      ? "Try adjusting your filters or search terms" 
                      : "No books have been registered yet"}
                  </p>
                  {(activeFilters.length > 0 || searchQuery) && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </Card>
              )}

              {/* Books List */}
              {!loading && !error && books.length > 0 && (
                <div className="space-y-4 w-full">
                  {books.map((book) => (
                    <Link key={book.id} to={`/book/${book.id}`} state={{ from: `${location.pathname}${location.search}` }}>
                      <Card className="w-full shadow-card hover:shadow-elegant transition-all duration-300 cursor-pointer">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex gap-4 mb-4">
                            {/* Book Cover */}
                            <div className="flex-shrink-0">
                              <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-md overflow-hidden shadow-sm">
                                <BookCover 
                                  title={book.title}
                                  author={book.author}
                                  size="M"
                                  className="w-full h-full"
                                />
                              </div>
                            </div>
                            
                            {/* Book Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <h3 className="font-bold text-lg truncate">{book.title}</h3>
                                    {activeFilters.includes('trending') && book.trendingScore && (
                                      <Badge variant="secondary" className="text-xs bg-gradient-primary text-primary-foreground flex-shrink-0">
                                        🔥 {book.trendingScore.toFixed(1)}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground truncate mb-2">by {book.author}</p>
                                   <div className="flex items-center gap-2 flex-wrap">
                                     {book.genre && (
                                       <Badge variant="secondary" className="flex-shrink-0">
                                         {formatGenreLabel(book.genre)}
                                       </Badge>
                                     )}
                                     {activeFilters.includes('global-journey') && (
                                       <Badge variant="secondary" className="text-xs flex-shrink-0">
                                         🌍 Traveling
                                       </Badge>
                                     )}
                                   </div>
                                </div>
                                <Button 
                                  variant={isBookFollowed(book.title, book.author) ? "outline" : "default"} 
                                  size="sm" 
                                  className={`w-full sm:w-auto flex-shrink-0 ${isBookFollowed(book.title, book.author) ? 'border-2 border-primary text-primary bg-primary/15 hover:bg-primary/25 font-bold shadow-sm' : ''}`}
                                  disabled={isBookFollowed(book.title, book.author)}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (!isBookFollowed(book.title, book.author)) {
                                      toggleFollow(book.title, book.author);
                                    }
                                  }}
                                >
                                  {isBookFollowed(book.title, book.author) ? (
                                    <>
                                      <Check className="h-4 w-4 font-bold" />
                                      Following
                                    </>
                                  ) : (
                                    'Follow Journey'
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center">
                              <Globe className="h-4 w-4 mr-1" />
                              {book.journeys} journeys
                            </span>
                            <span className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-1" />
                              {book.stories} stories
                            </span>
                            <span className="flex items-center">
                              📍 {book.currentLocation}
                            </span>
                          </div>
                          
                          {/* Special indicators based on active filters */}
                          {activeFilters.includes('trending') && (
                            <div className="bg-gradient-subtle/20 rounded-lg p-3 mb-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Trending Metrics:</span>
                                <div className="flex items-center space-x-3">
                                  <span className="text-primary">📈 Score: {book.trendingScore?.toFixed(1)}</span>
                                  <span>🔥 Hot</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {book.tags && book.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {book.tags.slice(0, 4).map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {book.tags.length > 4 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{book.tags.length - 4} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Stories - Sidebar */}
            <div className="w-full min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold mb-6">Recent Stories</h2>
              
              {storiesLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading stories...</span>
                </div>
              )}
              
              <div className="space-y-4">
                {!storiesLoading && recentStories.map((story) => (
                  <Link key={story.id} to={`/book/${story.id}`} className="block" state={{ from: `${location.pathname}${location.search}` }}>
                    <Card className="shadow-card hover:shadow-elegant transition-all duration-300 cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                            <span className="text-xs text-primary-foreground font-bold">
                              {story.profile.display_name?.[0] || story.profile.username[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              {story.profile.display_name || story.profile.username}
                            </p>
                            <p className="text-xs text-muted-foreground">{story.city}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-medium">{story.title}</p>
                          <span className="text-xs text-muted-foreground">by {story.author}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {story.notes}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {story.tags.slice(0, 2).map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(story.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                
                {!storiesLoading && recentStories.length === 0 && (
                  <Card className="p-6 text-center">
                    <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">No recent stories yet</p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollRestoreLayout>
  );
};

export default Explore;