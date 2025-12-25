import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Crown, Calendar, Users, BookOpen, Globe, MessageSquare, UserPlus, Filter, ChevronDown, Compass as CompassIcon, Heart, FolderPlus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Compass } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import ScrollRestoreLayout from '@/components/common/ScrollRestoreLayout';
import ThreeColumnLayout from '@/components/common/ThreeColumnLayout';
import MobileSectionTabs from '@/components/common/MobileSectionTabs';
import SearchHeader from '@/components/common/SearchHeader';
import SidebarCard from '@/components/common/SidebarCard';
import StatCard from '@/components/common/StatCard';
import ActionButton from '@/components/common/ActionButton';
import CommunityCard from '@/components/communities/CommunityCard';
import CommunitySidebar from '@/components/communities/CommunitySidebar';
import RecommendedCommunities from '@/components/communities/RecommendedCommunities';
import CreateCommunityDialog from '@/components/communities/CreateCommunityDialog';
import { supabase } from '@/integrations/supabase/client';
import { Community } from '@/types';
import { useAllCommunities } from '@/hooks/useAllCommunities';
import { useJoinedCommunities } from '@/hooks/useJoinedCommunities';
import { useCreatedCommunities } from '@/hooks/useCreatedCommunities';
import { useRecommendedCommunitiesData } from '@/hooks/useRecommendedCommunitiesData';
import { useCommunityStats } from '@/hooks/useCommunityStats';
import { useTrendingTopics } from '@/hooks/useTrendingTopics';
import { useUserActivity } from '@/hooks/useUserActivity';
import { useCommunityOfTheWeek } from '@/hooks/useCommunityOfTheWeek';

type CommunityFilterType = string;

const Communities = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<CommunityFilterType[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Use different hooks based on active section
  const allCommunities = useAllCommunities();
  const joinedCommunities = useJoinedCommunities();
  const createdCommunities = useCreatedCommunities();
  const recommendedCommunities = useRecommendedCommunitiesData();
  
  // Dynamic data hooks
  const { stats: communityStats, loading: statsLoading } = useCommunityStats();
  const { trendingTopics, loading: topicsLoading } = useTrendingTopics();
  const { activity: userActivity, loading: activityLoading } = useUserActivity();
  const { community: communityOfWeek, loading: communityWeekLoading } = useCommunityOfTheWeek();

  // Check authentication status
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);
        setIsCheckingAuth(false);
        
        // If user logs out and is on an auth-required section, switch to 'all'
        if (!session?.user && ['joined', 'created', 'recommended'].includes(activeSection)) {
          setActiveSection('all');
        }
      }
    );

    // THEN check for existing session (synchronous from localStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      setIsCheckingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, [activeSection]);

  // Get the current data based on active section
  const getCurrentData = () => {
    switch (activeSection) {
      case 'joined':
        return joinedCommunities;
      case 'created':
        return createdCommunities;
      case 'recommended':
        return recommendedCommunities;
      case 'all':
      default:
        return allCommunities;
    }
  };

  const { communities, loading, error } = getCurrentData();

  const handleJoinCommunity = async (communityId: string) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    const community = communities.find(c => c.id === communityId);
    if (!community || community.isJoined) return;

    try {
      await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: user!.id,
          role: 'member'
        });
      
      // Refresh the appropriate data
      allCommunities.refreshCommunities();
      joinedCommunities.refreshCommunities();
      createdCommunities.refreshCommunities();
      recommendedCommunities.refreshCommunities();
    } catch (error) {
      console.error('Error joining community:', error);
    }
  };

  const handleViewCommunityDetails = (communityId: string) => {
    navigate(`/communities/${communityId}`);
  };

  const handleCreateCommunity = async (newCommunityData: Omit<Community, 'id'>) => {
    if (!isAuthenticated || !user) {
      navigate('/auth');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: newCommunityData.name,
          description: newCommunityData.description,
          tags: newCommunityData.tags,
          category: 'Community',
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating community:', error);
        return;
      }

      // Refresh all data to show the new community
      allCommunities.refreshCommunities();
      joinedCommunities.refreshCommunities();
      createdCommunities.refreshCommunities();
    } catch (error) {
      console.error('Error creating community:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const mainFilterOptions = [
    { key: 'fiction', label: 'Fiction' },
    { key: 'literature', label: 'Literature' },
    { key: 'discussion', label: 'Discussion' },
    { key: 'creative', label: 'Creative' },
    { key: 'reading', label: 'Reading' },
    { key: 'books', label: 'Books' },
  ];

  const moreFilterOptions = [
    { key: 'programming', label: 'Programming' },
    { key: 'photography', label: 'Photography' },
    { key: 'health', label: 'Health' },
    { key: 'fitness', label: 'Fitness' },
    { key: 'art', label: 'Art' },
    { key: 'food', label: 'Food' },
    { key: 'lifestyle', label: 'Lifestyle' },
    { key: 'motivation', label: 'Motivation' },
    { key: 'mystery', label: 'Mystery' },
    { key: 'romance', label: 'Romance' },
    { key: 'science', label: 'Science' },
    { key: 'history', label: 'History' },
  ];

  const handleFilterToggle = (filter: CommunityFilterType) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSearchQuery('');
  };

  // Filter communities based on search query and active filters
  const getFilteredCommunities = () => {
    let filtered = communities;

    // Filter by active tag filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(community =>
        activeFilters.some(filter => 
          community.tags.some(tag => 
            tag.toLowerCase().includes(filter.toLowerCase())
          )
        )
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(community =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  };

  const filteredCommunities = getFilteredCommunities();

  const leftSidebar = (
    <CommunitySidebar 
      activeSection={activeSection} 
      onSectionChange={setActiveSection}
      recommendedSection={<RecommendedCommunities onJoinCommunity={isAuthenticated ? handleJoinCommunity : () => navigate('/auth')} />}
      isAuthenticated={isAuthenticated}
    />
  );

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'joined': return 'Joined Communities';
      case 'created': return 'Created Communities';
      case 'recommended': return 'Recommended Communities';
      default: return 'All Communities';
    }
  };

  const centerContent = (
    <div className="space-y-6">
      {/* Header with title and Create Community button on the same line */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {getSectionTitle()}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connect with fellow book lovers and join discussions
          </p>
        </div>
        {isCheckingAuth ? (
          <Button disabled className="opacity-50">
            Loading...
          </Button>
        ) : isAuthenticated ? (
          <CreateCommunityDialog onCreateCommunity={handleCreateCommunity} />
        ) : (
          <Button onClick={() => navigate('/auth')}>
            Sign in to Create
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Compass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/70 h-5 w-5 z-10" />
        <Input
          placeholder="Search communities by name, description, or tags..."
          className="pl-10 h-12 border-2 border-border/60 focus:border-primary/50 bg-background/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 w-full"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      
      {/* Filter Badges - only show for 'all' section */}
      {activeSection === 'all' && (
        <div className="flex flex-wrap gap-2 mb-4">
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
      
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg h-32"></div>
              </div>
            ))}
          </div>
        ) : filteredCommunities.length > 0 ? (
          filteredCommunities.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              onJoin={isAuthenticated ? handleJoinCommunity : () => navigate('/auth')}
              onViewDetails={handleViewCommunityDetails}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No communities found</h3>
            <p className="text-muted-foreground">
              {searchQuery || activeFilters.length > 0
                ? 'Try adjusting your search or filters'
                : `No ${activeSection === 'all' ? '' : activeSection + ' '}communities available`
              }
            </p>
            {(searchQuery || activeFilters.length > 0) && activeSection === 'all' && (
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear Search & Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Coordinated loading state for all sidebar sections
  const sidebarLoading = topicsLoading || communityWeekLoading || (isAuthenticated && activityLoading);

  const rightSidebar = (
    <>
      {sidebarLoading ? (
        // Skeleton placeholders for all sections while loading
        <>
          <SidebarCard title="Trending Topics" icon={TrendingUp}>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
              ))}
            </div>
          </SidebarCard>
          <SidebarCard title="Community of the Week" icon={Crown} className="border-primary/20">
            <div>
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3 mb-3" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          </SidebarCard>
          {isAuthenticated && (
            <SidebarCard title="Your Activity">
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            </SidebarCard>
          )}
        </>
      ) : (
        // All sections rendered together after loading
        <>
          {trendingTopics.length > 0 && (
            <SidebarCard title="Trending Topics" icon={TrendingUp}>
              <div className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{topic.tag}</span>
                    <Badge variant="secondary" className="text-xs">
                      {topic.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </SidebarCard>
          )}

          {communityOfWeek && (
            <SidebarCard title="Community of the Week" icon={Crown} className="border-primary/20">
              <div>
                <h4 className="font-semibold mb-2">{communityOfWeek.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Most active community this week with {communityOfWeek.messageCount} new discussions!
                </p>
                <ActionButton 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate(`/communities/${communityOfWeek.id}`)}
                >
                  Visit Community
                </ActionButton>
              </div>
            </SidebarCard>
          )}

          {isAuthenticated && (
            <SidebarCard title="Your Activity">
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Communities Joined</span>
                    <span className="font-semibold">{userActivity.communitiesJoined}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Messages Sent</span>
                    <span className="font-semibold">{userActivity.messagesSent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Books Shared</span>
                    <span className="font-semibold">{userActivity.booksShared}</span>
                  </div>
                </div>
              </div>
            </SidebarCard>
          )}
        </>
      )}
    </>
  );

  return (
    <ScrollRestoreLayout>

      {/* Mobile Section Tabs */}
      <MobileSectionTabs
        tabs={[
          { key: 'all', label: 'All', icon: <CompassIcon className="h-3.5 w-3.5" /> },
          { key: 'joined', label: 'Joined', icon: <Heart className="h-3.5 w-3.5" />, requiresAuth: true },
          { key: 'created', label: 'Created', icon: <FolderPlus className="h-3.5 w-3.5" />, requiresAuth: true },
          { key: 'recommended', label: 'For You', icon: <Sparkles className="h-3.5 w-3.5" />, requiresAuth: true },
        ]}
        activeTab={activeSection}
        onTabChange={setActiveSection}
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

 {/* Community Stats - Show on all devices but optimize for mobile */}
      {!statsLoading && (
        <div className="mt-6 sm:mt-8 md:mt-12 lg:mt-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <StatCard
              title="Active Communities"
              value={communityStats.activeCommunities.toString()}
              description="Active Communities"
              icon={Users}
              gradient={true}
            />
            <StatCard
              title="Community Members"
              value={communityStats.totalMembers.toString()}
              description="Total Members"
              icon={UserPlus}
              gradient={true}
            />
            <StatCard
              title="Messages Shared"
              value={communityStats.totalMessages.toString()}
              description="Total Messages"
              icon={MessageSquare}
              gradient={true}
            />
          </div>
        </div>
      )}
    </ScrollRestoreLayout>
  );
};

export default Communities;
