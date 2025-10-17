
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Crown, Calendar, Users, BookOpen, Globe, MessageSquare, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Compass } from "lucide-react";

import ScrollRestoreLayout from '@/components/common/ScrollRestoreLayout';
import ThreeColumnLayout from '@/components/common/ThreeColumnLayout';
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

const Communities = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsAuthenticated(!!user);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      
      // If user logs out and is on an auth-required section, switch to 'all'
      if (!session?.user && ['joined', 'created', 'recommended'].includes(activeSection)) {
        setActiveSection('all');
      }
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
    console.log('Searching for:', query);
  };

  // Filter communities based on search query only (section filtering is handled by hooks)
  const getFilteredCommunities = () => {
    let filtered = communities;

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
    <div>
      <SearchHeader
        title={getSectionTitle()}
        placeholder="Search communities..."
        onSearch={handleSearch}
        icon={Compass}
      />
      
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
              {searchQuery 
                ? `No communities match "${searchQuery}"`
                : `No ${activeSection === 'all' ? '' : activeSection + ' '}communities available`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const rightSidebar = (
    <>
      <SidebarCard title="Quick Actions">
        <div className="space-y-3">
          {isAuthenticated ? (
            <CreateCommunityDialog onCreateCommunity={handleCreateCommunity} />
          ) : (
            <ActionButton 
              variant="primary" 
              className="w-full" 
              onClick={() => navigate('/auth')}
            >
              Sign in to Create Community
            </ActionButton>
          )}
          <ActionButton variant="outline" className="w-full" icon={Calendar}>
            Browse Events
          </ActionButton>
        </div>
      </SidebarCard>

{!topicsLoading && trendingTopics.length > 0 && (
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

{!communityWeekLoading && communityOfWeek && (
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

{isAuthenticated && !activityLoading && (
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
  );

  return (
    <ScrollRestoreLayout>
      {/* Header */}
      <div className="text-center mb-6 md:mb-8 lg:mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-3 lg:mb-4">
          Book Communities
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
          Connect with fellow book lovers, join discussions, and discover new reading communities
        </p>
      </div>

      <ThreeColumnLayout 
        leftSidebar={leftSidebar}
        centerContent={centerContent}
        rightSidebar={rightSidebar}
        leftColSpan={3}
        centerColSpan={6}
        rightColSpan={3}
      />

{/* Community Stats - Show on all devices but optimize for mobile */}
      {!statsLoading && (
        <div className="mt-8 md:mt-12 lg:mt-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
