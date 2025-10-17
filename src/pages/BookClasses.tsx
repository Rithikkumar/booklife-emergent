import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import HostClassDialog from "@/components/classes/HostClassDialog";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { useUserClassStats } from "@/hooks/useUserClassStats";
import { useBookClassesSearch, ClassFilterType } from "@/hooks/useBookClassesSearch";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Video, 
  Clock, 
  Users, 
  Star, 
  Calendar,
  BookOpen,
  Mic,
  Play,
  ExternalLink,
  Search,
  X,
  TrendingUp,
  Globe,
  Filter,
  ChevronDown
} from "lucide-react";

const BookClasses = () => {
  const navigate = useNavigate();
  const { liveClasses, loading: classesLoading, joinClass } = useLiveClasses();
  const { stats, loading: statsLoading } = useUserClassStats();
  const { 
    classes: searchedClasses, 
    loading: searchLoading, 
    searchQuery, 
    activeFilters, 
    handleSearch, 
    handleFilterToggle, 
    clearFilters 
  } = useBookClassesSearch();

  const handleJoinClass = async (classId: string, joinUrl?: string, isLiveClass?: boolean) => {
    const success = await joinClass(classId);
    if (success && isLiveClass && joinUrl) {
      window.open(joinUrl, '_blank');
    }
  };

  const handleCardClick = (classId: string, e: React.MouseEvent) => {
    // Prevent navigation if clicking on buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    navigate(`/class/${classId}`);
  };

  const formatScheduledTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (date > now) {
      return `Starting ${formatDistanceToNow(date, { addSuffix: true })}`;
    } else {
      return `Started ${formatDistanceToNow(date, { addSuffix: true })}`;
    }
  };

  const mainFilterOptions = [
    { key: 'trending' as ClassFilterType, label: 'Trending', icon: TrendingUp },
    { key: 'live-now' as ClassFilterType, label: 'Live Now', icon: Video },
    { key: 'writing' as ClassFilterType, label: 'Writing', icon: null },
    { key: 'analysis' as ClassFilterType, label: 'Analysis', icon: null },
    { key: 'discussion' as ClassFilterType, label: 'Discussion', icon: null },
    { key: 'creative' as ClassFilterType, label: 'Creative', icon: null },
    { key: 'literature' as ClassFilterType, label: 'Literature', icon: null },
    { key: 'fiction' as ClassFilterType, label: 'Fiction', icon: null },
  ];

  const moreFilterOptions = [
    { key: 'publishing' as ClassFilterType, label: 'Publishing', icon: null },
    { key: 'non-fiction' as ClassFilterType, label: 'Non-Fiction', icon: null },
    { key: 'mystery' as ClassFilterType, label: 'Mystery', icon: null },
    { key: 'romance' as ClassFilterType, label: 'Romance', icon: null },
    { key: 'science-fiction' as ClassFilterType, label: 'Sci-Fi', icon: null },
    { key: 'fantasy' as ClassFilterType, label: 'Fantasy', icon: null },
    { key: 'thriller' as ClassFilterType, label: 'Thriller', icon: null },
    { key: 'historical-fiction' as ClassFilterType, label: 'Historical Fiction', icon: null },
    { key: 'biography' as ClassFilterType, label: 'Biography', icon: null },
    { key: 'self-help' as ClassFilterType, label: 'Self Help', icon: null },
    { key: 'young-adult' as ClassFilterType, label: 'Young Adult', icon: null },
    { key: 'children' as ClassFilterType, label: 'Children', icon: null },
    { key: 'horror' as ClassFilterType, label: 'Horror', icon: null },
    { key: 'adventure' as ClassFilterType, label: 'Adventure', icon: null },
    { key: 'poetry' as ClassFilterType, label: 'Poetry', icon: null },
    { key: 'drama' as ClassFilterType, label: 'Drama', icon: null },
    { key: 'philosophy' as ClassFilterType, label: 'Philosophy', icon: null },
    { key: 'psychology' as ClassFilterType, label: 'Psychology', icon: null },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-32 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Book Classes
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Learn from passionate book lovers and literature enthusiasts. Join classes or host your own to share knowledge with the community.
            </p>
          </div>

          {/* Create Class Button */}
          <div className="text-center mb-8">
            <HostClassDialog>
              <Button className="bg-gradient-primary hover:shadow-glow">
                <Video className="h-4 w-4 mr-2" />
                Host a Class
              </Button>
            </HostClassDialog>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8 lg:mb-12">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/70 h-5 w-5 z-10" />
              <Input
                placeholder="Search classes by title, instructor, book, or tags..."
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

          <div className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Live Classes Sidebar */}
              <div className="order-2 lg:order-1">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                  Live Now
                </h2>
                <div className="space-y-3">
                  {classesLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <Card key={index} className="shadow-card">
                        <CardContent className="p-4">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2 mb-2" />
                          <div className="flex items-center justify-between mb-3">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-5 w-12" />
                          </div>
                          <Skeleton className="h-8 w-full" />
                        </CardContent>
                      </Card>
                    ))
                  ) : liveClasses.length > 0 ? (
                    liveClasses.slice(0, 5).map((liveClass) => (
                      <Card 
                        key={liveClass.id} 
                        className="shadow-card hover:shadow-elegant transition-all duration-300 cursor-pointer"
                        onClick={(e) => handleCardClick(liveClass.id, e)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-sm leading-tight">{liveClass.title}</h3>
                            {liveClass.is_ongoing && (
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-2 mt-1 flex-shrink-0"></div>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-2">
                            by {liveClass.host_name}
                          </p>
                          
                          {liveClass.book_title && (
                            <div className="text-xs text-muted-foreground mb-2 flex items-center">
                              <BookOpen className="h-3 w-3 mr-1" />
                              {liveClass.book_title}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-muted-foreground">
                              {formatScheduledTime(liveClass.scheduled_date)}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {liveClass.participant_count}
                            </Badge>
                          </div>
                          
                          <Button 
                            size="sm" 
                            className={`w-full ${liveClass.is_ongoing ? 'bg-gradient-primary' : ''}`}
                            variant={liveClass.is_ongoing ? "default" : "outline"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinClass(liveClass.id, liveClass.platform_join_url || undefined, liveClass.is_ongoing);
                            }}
                            disabled={!liveClass.platform_join_url && liveClass.is_ongoing}
                          >
                            {liveClass.is_ongoing ? (
                              <>
                                <Play className="h-3 w-3 mr-2" />
                                Join Live
                              </>
                            ) : (
                              <>
                                <Calendar className="h-3 w-3 mr-2" />
                                Register
                              </>
                            )}
                          </Button>
                          
                          {liveClass.platform_join_url && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="w-full mt-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/class/${liveClass.id}`);
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="shadow-card">
                      <CardContent className="p-4 text-center">
                        <div className="text-muted-foreground text-sm">
                          <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          No live classes right now
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Check back later or host your own!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="mt-8 p-4 bg-card rounded-lg shadow-card">
                  <h3 className="font-semibold mb-3">Your Learning</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Classes Joined</span>
                      {statsLoading ? (
                        <Skeleton className="h-4 w-8" />
                      ) : (
                        <span className="font-medium">{stats.classesJoined}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hours Learned</span>
                      {statsLoading ? (
                        <Skeleton className="h-4 w-8" />
                      ) : (
                        <span className="font-medium">{stats.hoursLearned}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Classes Hosted</span>
                      {statsLoading ? (
                        <Skeleton className="h-4 w-8" />
                      ) : (
                        <span className="font-medium">{stats.hostedClasses}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed</span>
                      {statsLoading ? (
                        <Skeleton className="h-4 w-8" />
                      ) : (
                        <span className="font-medium">{stats.completedClasses}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Book Classes - Main Content */}
              <div className="order-1 lg:order-2 lg:col-span-2">
                <div className="flex items-center space-x-2 mb-4">
                  <h2 className="text-xl font-bold">Book Classes</h2>
                  {(searchQuery || activeFilters.length > 0) && (
                    <Badge variant="secondary" className="text-xs">
                      {searchedClasses.length} results
                    </Badge>
                  )}
                </div>

                {searchLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Card key={index} className="shadow-card">
                        <CardHeader>
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <div className="flex items-center space-x-2 mb-2">
                            <Skeleton className="w-6 h-6 rounded-full" />
                            <div>
                              <Skeleton className="h-4 w-20 mb-1" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-2/3" />
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2 mb-4">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-20" />
                          </div>
                          <Skeleton className="h-8 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : searchedClasses.length > 0 ? (
                  <div className="space-y-4">
                    {searchedClasses.map((classItem) => (
                      <Card 
                        key={classItem.id} 
                        className="shadow-card hover:shadow-elegant transition-all duration-300 cursor-pointer"
                        onClick={(e) => handleCardClick(classItem.id, e)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-2">{classItem.title}</CardTitle>
                              <div className="flex items-center space-x-2 mb-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {classItem.host_name?.split(' ').map(n => n[0]).join('') || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{classItem.host_name}</p>
                                  <p className="text-xs text-muted-foreground">@{classItem.host_username}</p>
                                </div>
                              </div>
                            </div>
                            {classItem.is_ongoing && (
                              <Badge variant="destructive" className="text-xs">
                                <div className="w-1 h-1 bg-white rounded-full mr-1 animate-pulse"></div>
                                Live
                              </Badge>
                            )}
                          </div>
                          <CardDescription>{classItem.description}</CardDescription>
                          
                          {classItem.book_title && (
                            <div className="mt-2 p-2 bg-muted/50 rounded-md">
                              <div className="flex items-center space-x-2">
                                <BookOpen className="h-4 w-4 text-primary" />
                                <div>
                                  <p className="text-sm font-medium">{classItem.book_title}</p>
                                  {classItem.book_author && (
                                    <p className="text-xs text-muted-foreground">by {classItem.book_author}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {classItem.category && (
                              <Badge variant="default" className="text-xs">
                                {classItem.category}
                              </Badge>
                            )}
                            {classItem.tags?.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-3">
                              <span className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {classItem.participant_count}/{classItem.max_participants}
                              </span>
                              {classItem.duration_minutes && (
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {classItem.duration_minutes}min
                                </span>
                              )}
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatScheduledTime(classItem.scheduled_date)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              <p>Platform: {classItem.platform}</p>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/class/${classItem.id}`);
                                }}
                              >
                                Details
                              </Button>
                              <Button 
                                className={`${classItem.is_ongoing ? 'bg-gradient-primary' : ''}`}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinClass(classItem.id, classItem.platform_join_url, classItem.is_ongoing);
                                }}
                                disabled={!classItem.platform_join_url && classItem.is_ongoing}
                              >
                                {classItem.is_ongoing ? 'Join Live' : 'Register'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No classes found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || activeFilters.length > 0 
                        ? "Try adjusting your search or filters"
                        : "No classes are currently available"}
                    </p>
                    {(searchQuery || activeFilters.length > 0) && (
                      <Button variant="outline" onClick={clearFilters}>
                        Clear Search & Filters
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Host Benefits */}
            <div className="mt-16 bg-gradient-subtle rounded-lg p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-4">Share Your Knowledge</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Host your own book classes and share your passion for literature with readers worldwide. Anyone can create and host classes on topics they love.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="p-4">
                  <Mic className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Easy Teaching Tools</h3>
                  <p className="text-sm text-muted-foreground">
                    Built-in video conferencing, screen sharing, and interactive whiteboards
                  </p>
                </div>
                <div className="p-4">
                  <BookOpen className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Flexible Scheduling</h3>
                  <p className="text-sm text-muted-foreground">
                    Set your own schedule and teach at your preferred times
                  </p>
                </div>
                <div className="p-4">
                  <Users className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Global Reach</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with book lovers from around the world
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookClasses;