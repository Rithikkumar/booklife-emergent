import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Users, Activity, Info } from 'lucide-react';
import PageLayout from '@/components/common/PageLayout';
import CommunityHeader from '@/components/communities/CommunityHeader';
import CommunityChat from '@/components/communities/CommunityChat';
import CommunityMembersGrid from '@/components/communities/CommunityMembersGrid';
import CommunityActivity from '@/components/communities/CommunityActivity';
import CommunityAbout from '@/components/communities/CommunityAbout';
import { useCommunityDetails } from '@/hooks/useCommunityDetails';
import { useCommunityChat } from '@/hooks/useCommunityChat';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CommunityDetail: React.FC = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  
  const { 
    community, 
    loading: communityLoading, 
    joining, 
    joinCommunity, 
    confirmLeaveCommunity, 
    showLeaveDialog, 
    setShowLeaveDialog,
    joinRequestStatus
  } = useCommunityDetails(communityId);

  const {
    members,
    loading: membersLoading,
  } = useCommunityChat(communityId);

  const handleBack = () => {
    navigate('/communities');
  };


  if (communityLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Header Skeleton */}
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-full max-w-2xl" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
          
          {/* Tabs Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!community) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Community not found</p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return community.isUserMember ? (
          <CommunityChat 
            communityId={communityId!}
            communityName={community.name}
          />
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center p-8">
              <MessageSquare className="h-16 w-16 mx-auto mb-6 text-muted-foreground/50" />
              <h2 className="text-xl font-semibold mb-4">Join to Participate in Chat</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                You need to join this community to view and participate in discussions.
              </p>
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-medium mb-2 text-sm">What you'll get:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Access to real-time community discussions</li>
                  <li>• Connect with like-minded members</li>
                  <li>• Share your thoughts and experiences</li>
                  <li>• Get help and support from the community</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        );
        
      case 'members':
        return (
          <CommunityMembersGrid 
            members={members}
            loading={membersLoading}
          />
        );
        
      case 'activity':
        return <CommunityActivity community={community} />;
        
      case 'about':
        return (
          <CommunityAbout 
            community={community}
            members={members}
            membersLoading={membersLoading}
            onTabChange={setActiveTab}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 pb-4 space-y-4 -mt-4 md:-mt-6">
        {/* Back Navigation */}
        <button 
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-all duration-200 hover:gap-3 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Back to Communities</span>
        </button>

        {/* Community Header */}
        <CommunityHeader
          community={community}
          members={members}
          onJoin={joinCommunity}
          joining={joining}
          showLeaveDialog={showLeaveDialog}
          onConfirmLeave={confirmLeaveCommunity}
          onCancelLeave={() => setShowLeaveDialog(false)}
              onUpdate={() => {}}
          joinRequestStatus={joinRequestStatus}
        />

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">About</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            {renderTabContent()}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default CommunityDetail;