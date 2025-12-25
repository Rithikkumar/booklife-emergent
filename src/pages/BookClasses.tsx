import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import HostClassDialog from "@/components/classes/HostClassDialog";
import ClassesSidebar, { ClassSection } from "@/components/classes/ClassesSidebar";
import ClassCard from "@/components/classes/ClassCard";
import ClassStatsCard from "@/components/classes/ClassStatsCard";
import ThreeColumnLayout from "@/components/common/ThreeColumnLayout";
import MobileSectionTabs from "@/components/common/MobileSectionTabs";
import ScrollRestoreLayout from "@/components/common/ScrollRestoreLayout";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { useUserClassStats } from "@/hooks/useUserClassStats";
import { useAllBookClasses } from "@/hooks/useAllBookClasses";
import { ClassFilterType } from "@/hooks/useBookClassesSearch";
import { useMyHostedClasses } from "@/hooks/useMyHostedClasses";
import { useMyJoinedClasses } from "@/hooks/useMyJoinedClasses";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Video, 
  Search,
  Filter,
  ChevronDown,
  Mic,
  BookOpen,
  Users,
  Radio,
  Calendar,
  FolderOpen,
  CheckCircle,
  LayoutGrid
} from "lucide-react";

const BookClasses = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ClassSection>('all');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const { liveClasses, loading: liveLoading, joinClass } = useLiveClasses();
  const { stats, loading: statsLoading } = useUserClassStats();
  const { classes: hostedClasses, loading: hostedLoading } = useMyHostedClasses();
  const { classes: joinedClasses, loading: joinedLoading } = useMyJoinedClasses();
  const { 
    classes: allClasses, 
    loading: allLoading, 
    searchQuery, 
    handleSearch,
  } = useAllBookClasses();
  
  // Create a set of joined class IDs for quick lookup
  const joinedClassIds = new Set(joinedClasses.map(c => c.id));
  // Create a set of hosted class IDs for quick lookup
  const hostedClassIds = new Set(hostedClasses.map(c => c.id));
  
  const [activeFilters, setActiveFilters] = useState<ClassFilterType[]>([]);
  
  const handleFilterToggle = (filter: ClassFilterType) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };
  
  const clearFilters = () => {
    setActiveFilters([]);
    handleSearch('');
  };

  useEffect(() => {
    const checkAuth = async () => {
      // Use getSession for faster cached check
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
      setCurrentUserId(session?.user?.id || null);
      setIsCheckingAuth(false);
    };
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session?.user);
      setCurrentUserId(session?.user?.id || null);
      setIsCheckingAuth(false);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleJoinClass = async (classId: string, joinUrl?: string, isLive?: boolean) => {
    const success = await joinClass(classId);
    if (success && isLive && joinUrl) {
      window.open(joinUrl, '_blank');
    }
  };

  const mainFilterOptions = [
    { key: 'trending' as ClassFilterType, label: 'Trending' },
    { key: 'writing' as ClassFilterType, label: 'Writing' },
    { key: 'analysis' as ClassFilterType, label: 'Analysis' },
    { key: 'discussion' as ClassFilterType, label: 'Discussion' },
    { key: 'creative' as ClassFilterType, label: 'Creative' },
    { key: 'literature' as ClassFilterType, label: 'Literature' },
    { key: 'fiction' as ClassFilterType, label: 'Fiction' },
  ];

  const moreFilterOptions = [
    { key: 'publishing' as ClassFilterType, label: 'Publishing' },
    { key: 'non-fiction' as ClassFilterType, label: 'Non-Fiction' },
    { key: 'mystery' as ClassFilterType, label: 'Mystery' },
    { key: 'romance' as ClassFilterType, label: 'Romance' },
    { key: 'science-fiction' as ClassFilterType, label: 'Sci-Fi' },
    { key: 'fantasy' as ClassFilterType, label: 'Fantasy' },
    { key: 'thriller' as ClassFilterType, label: 'Thriller' },
    { key: 'historical-fiction' as ClassFilterType, label: 'Historical Fiction' },
    { key: 'biography' as ClassFilterType, label: 'Biography' },
    { key: 'self-help' as ClassFilterType, label: 'Self Help' },
    { key: 'young-adult' as ClassFilterType, label: 'Young Adult' },
    { key: 'children' as ClassFilterType, label: 'Children' },
    { key: 'horror' as ClassFilterType, label: 'Horror' },
    { key: 'poetry' as ClassFilterType, label: 'Poetry' },
  ];

  // Local search filter for sections that don't use the backend search
  const filterBySearchQuery = (classes: any[]) => {
    if (!searchQuery.trim()) return classes;
    const query = searchQuery.toLowerCase();
    return classes.filter(c => 
      c.title?.toLowerCase().includes(query) ||
      c.book_title?.toLowerCase().includes(query) ||
      c.book_author?.toLowerCase().includes(query) ||
      c.host_name?.toLowerCase().includes(query) ||
      c.host_username?.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query) ||
      c.tags?.some((tag: string) => tag.toLowerCase().includes(query))
    );
  };

  // Get current classes based on active section
  const getCurrentClasses = () => {
    let classes;
    switch (activeSection) {
      case 'live':
        // Show classes that are currently live or starting very soon
        classes = liveClasses.filter(c => c.is_ongoing || c.status === 'live').map(c => ({
          ...c,
          is_ongoing: c.is_ongoing,
          host_name: c.host_name,
          host_username: c.host_username
        }));
        return filterBySearchQuery(classes);
      case 'upcoming':
        // Show all scheduled classes that are in the future
        classes = allClasses.filter(c => {
          // Must be in scheduled status (not live, ended, draft)
          if (c.status !== 'scheduled') return false;
          // If there's a scheduled date, it must be in the future
          if (c.scheduled_date) {
            return new Date(c.scheduled_date) > new Date();
          }
          // Classes without scheduled_date but in scheduled status are still upcoming (TBD)
          return true;
        });
        return classes; // Already filtered by backend search
      case 'hosted':
        classes = hostedClasses.map(c => ({ ...c, host_name: 'You', host_username: '' }));
        return filterBySearchQuery(classes);
      case 'joined':
        return filterBySearchQuery(joinedClasses);
      case 'all':
      default:
        return allClasses; // Already filtered by backend search
    }
  };

  const isLoading = () => {
    switch (activeSection) {
      case 'live': return liveLoading;
      case 'hosted': return hostedLoading;
      case 'joined': return joinedLoading;
      default: return allLoading;
    }
  };

  const currentClasses = getCurrentClasses();
  const loading = isLoading();

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'live': return 'Live Now';
      case 'upcoming': return 'Upcoming Classes';
      case 'hosted': return 'My Hosted Classes';
      case 'joined': return 'Joined Classes';
      default: return 'All Classes';
    }
  };

  const leftSidebar = (
    <>
      <ClassesSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isAuthenticated={isAuthenticated}
        isCheckingAuth={isCheckingAuth}
        liveCount={liveClasses.length}
        hostedCount={hostedClasses.length}
        joinedCount={joinedClasses.length}
      />
    </>
  );

  const centerContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {getSectionTitle()}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeSection === 'hosted' 
              ? 'Manage your classes and view registrations'
              : activeSection === 'joined'
              ? 'Classes you\'ve registered for'
              : 'Discover and join book classes'}
          </p>
        </div>
        <HostClassDialog>
          <Button className="bg-gradient-primary hover:shadow-glow">
            <Video className="h-4 w-4 mr-2" />
            Host a Class
          </Button>
        </HostClassDialog>
      </div>

      {/* Search Bar - show for all sections */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/70 h-5 w-5 z-10" />
        <Input
          placeholder={
            activeSection === 'hosted' 
              ? "Search your hosted classes..." 
              : activeSection === 'joined'
              ? "Search your joined classes..."
              : activeSection === 'live'
              ? "Search live classes..."
              : "Search classes by title, instructor, book, or tags..."
          }
          className="pl-10 h-12 border-2 border-border/60 focus:border-primary/50 bg-background/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 w-full"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      {/* Filters - only show for all section */}
      {activeSection === 'all' && (
        <div className="flex flex-wrap gap-2">
          {mainFilterOptions.map((filter) => {
            const isActive = activeFilters.includes(filter.key);
            
            return (
              <Badge 
                key={filter.key}
                variant={isActive ? "secondary" : "outline"} 
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105" 
                    : "hover:bg-primary/10 hover:border-primary hover:text-primary"
                )}
                onClick={() => handleFilterToggle(filter.key)}
              >
                {filter.label}
                {isActive && <span className="ml-1 text-xs">✓</span>}
              </Badge>
            );
          })}

          {moreFilterOptions
            .filter(filter => activeFilters.includes(filter.key))
            .map((filter) => (
              <Badge 
                key={filter.key}
                variant="secondary"
                className="cursor-pointer bg-primary text-primary-foreground border-primary shadow-lg scale-105"
                onClick={() => handleFilterToggle(filter.key)}
              >
                {filter.label}
                <span className="ml-1 text-xs">✓</span>
              </Badge>
            ))}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                size="sm"
                className="rounded-full h-7 px-3 cursor-pointer hover:bg-primary/10 hover:border-primary hover:text-primary"
              >
                <Filter className="h-3 w-3 mr-1" />
                More
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
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground border-destructive text-destructive"
              onClick={clearFilters}
            >
              Clear All {activeFilters.length > 0 && `(${activeFilters.length})`}
            </Badge>
          )}
        </div>
      )}

      {/* Classes List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="shadow-card">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : currentClasses.length > 0 ? (
        <div className="space-y-4">
          {currentClasses.map((classItem) => {
            const isOwner = currentUserId ? (
              classItem.host_user_id === currentUserId || 
              hostedClassIds.has(classItem.id)
            ) : false;
            const isJoined = joinedClassIds.has(classItem.id);
            
            return (
              <ClassCard
                key={classItem.id}
                classItem={classItem}
                onJoin={!isOwner && !isJoined ? handleJoinClass : undefined}
                showHost={activeSection !== 'hosted'}
                isOwner={isOwner}
                isJoined={isJoined}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">
            {activeSection === 'hosted' 
              ? 'No classes hosted yet'
              : activeSection === 'joined'
              ? 'No classes joined yet'
              : 'No classes found'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {activeSection === 'hosted' 
              ? 'Start hosting classes to share your knowledge!'
              : activeSection === 'joined'
              ? 'Browse available classes and register to get started'
              : searchQuery || activeFilters.length > 0 
                ? 'Try adjusting your search or filters'
                : 'No classes are currently available'}
          </p>
          {activeSection === 'hosted' && (
            <HostClassDialog>
              <Button className="bg-gradient-primary hover:shadow-glow">
                <Video className="h-4 w-4 mr-2" />
                Host Your First Class
              </Button>
            </HostClassDialog>
          )}
          {(searchQuery || activeFilters.length > 0) && activeSection === 'all' && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Search & Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );

  const rightSidebar = (
    <div className="space-y-6">
      {/* Stats Card */}
      {isAuthenticated && (
        <ClassStatsCard stats={stats} loading={statsLoading} />
      )}

      {/* Host Benefits */}
      <div className="bg-gradient-subtle rounded-lg p-6">
        <h3 className="font-semibold mb-4">Share Your Knowledge</h3>
        <div className="space-y-4 text-sm">
          <div className="flex items-start space-x-3">
            <Mic className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Easy Teaching Tools</p>
              <p className="text-muted-foreground text-xs">Video conferencing and screen sharing</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <BookOpen className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Flexible Scheduling</p>
              <p className="text-muted-foreground text-xs">Teach at your preferred times</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Users className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Global Reach</p>
              <p className="text-muted-foreground text-xs">Connect with readers worldwide</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ScrollRestoreLayout scrollKey={`book-classes:${activeSection}`}>
      {/* Mobile Section Tabs */}
      <MobileSectionTabs
        tabs={[
          { key: 'all', label: 'All', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
          { key: 'live', label: 'Live Now', icon: <Radio className="h-3.5 w-3.5" />, count: liveClasses.filter(c => c.is_ongoing || c.status === 'live').length },
          { key: 'upcoming', label: 'Upcoming', icon: <Calendar className="h-3.5 w-3.5" /> },
          { key: 'hosted', label: 'Hosted', icon: <FolderOpen className="h-3.5 w-3.5" />, count: hostedClasses.length, requiresAuth: true },
          { key: 'joined', label: 'Joined', icon: <CheckCircle className="h-3.5 w-3.5" />, count: joinedClasses.length, requiresAuth: true },
        ]}
        activeTab={activeSection}
        onTabChange={(tab) => setActiveSection(tab as ClassSection)}
        isAuthenticated={isAuthenticated}
      />

      <ThreeColumnLayout
        leftSidebar={leftSidebar}
        centerContent={centerContent}
        rightSidebar={rightSidebar}
        leftColSpan={3}
        centerColSpan={6}
        rightColSpan={3}
        hideLeftOnMobile={true}
      />
    </ScrollRestoreLayout>
  );
};

export default BookClasses;
