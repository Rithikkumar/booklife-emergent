import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Users, Info, Video } from 'lucide-react';
import ScrollRestoreLayout from '@/components/common/ScrollRestoreLayout';
import VideoMeeting from '@/components/classes/VideoMeeting';
import YouTubeLiveChat from '@/components/classes/YouTubeLiveChat';
import ClassHeader from '@/components/classes/ClassHeader';
import ClassAbout from '@/components/classes/ClassAbout';
import ClassParticipants from '@/components/classes/ClassParticipants';
import UpcomingClassOverview from '@/components/classes/UpcomingClassOverview';
import { getClassStatus } from '@/utils/classTime';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClassData {
  id: string;
  title: string;
  description: string;
  book_title: string;
  book_author: string;
  book_cover_url?: string;
  platform: string;
  platform_meeting_id: string;
  platform_join_url: string;
  scheduled_date: string;
  duration_minutes: number;
  max_participants: number;
  user_id: string;
  status: string;
}

const LiveClass = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const handleBack = () => {
    navigate('/book-classes');
  };

  useEffect(() => {
    if (id) {
      loadClassData();
    }
  }, [id]);

  const loadClassData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: classInfo, error } = await supabase
        .from('book_classes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setClassData(classInfo);
      setIsHost(user?.id === classInfo.user_id);

      // Check if user is already joined
      if (user) {
        const { data: participant } = await supabase
          .from('class_participants')
          .select('*')
          .eq('class_id', id)
          .eq('user_id', user.id)
          .single();

        setIsJoined(!!participant);
      }

      // Load participant count
      const { count } = await supabase
        .from('class_participants')
        .select('*', { count: 'exact' })
        .eq('class_id', id);

      setParticipants(count || 0);

    } catch (error: any) {
      toast({
        title: "Error loading class",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const joinClass = async () => {
    try {
      setJoining(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to join the class.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('class_participants')
        .insert({
          class_id: id!,
          user_id: user.id
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already registered",
            description: "You are already registered for this class.",
          });
          setIsJoined(true);
          return;
        }
        throw error;
      }

      setIsJoined(true);
      setParticipants(prev => prev + 1);

      toast({
        title: "Successfully joined!",
        description: "You have been registered for this class.",
      });

    } catch (error: any) {
      toast({
        title: "Failed to join class",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setJoining(false);
    }
  };

  const leaveClass = async () => {
    try {
      setJoining(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('class_participants')
        .delete()
        .eq('class_id', id!)
        .eq('user_id', user.id);

      if (error) throw error;

      setIsJoined(false);
      setParticipants(prev => Math.max(0, prev - 1));

      toast({
        title: "Left class",
        description: "You have left the class.",
      });

    } catch (error: any) {
      toast({
        title: "Failed to leave class",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <ScrollRestoreLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ScrollRestoreLayout>
    );
  }

  if (!classData) {
    return (
      <ScrollRestoreLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Class Not Found</h2>
          <p className="text-muted-foreground">The requested class could not be found.</p>
        </div>
      </ScrollRestoreLayout>
    );
  }

  const renderTabContent = () => {
    const status = getClassStatus(classData.scheduled_date, classData.duration_minutes);
    
    switch (activeTab) {
      case 'overview':
        // Show different content based on class status
        if (status.isUpcoming) {
          return (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <UpcomingClassOverview
                  classData={classData}
                  participants={participants}
                  isJoined={isJoined}
                />
              </div>
              
              {/* Quick Participants Preview */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Participants</h3>
                      <span className="text-sm text-muted-foreground">{participants} registered</span>
                    </div>
                    <div className="space-y-2">
                      {Array.from({ length: Math.min(participants + 1, 4) }, (_, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                            {i === 0 ? 'H' : i}
                          </div>
                          <span className="text-muted-foreground">
                            {i === 0 ? 'Host' : `Participant ${i}`}
                          </span>
                        </div>
                      ))}
                      {participants > 3 && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          +{participants - 3} more
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        } else if (status.isLive) {
          // Show video meeting for live classes
          return (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Video Meeting */}
              <div className="lg:col-span-2">
                <VideoMeeting
                  platform={classData.platform}
                  meetingId={classData.platform_meeting_id}
                  isHost={isHost}
                  onLeave={leaveClass}
                />
              </div>

              {/* Chat (for YouTube Live) or Quick Participants */}
              <div className="space-y-6">
                {classData.platform === 'youtube_live' && (
                  <YouTubeLiveChat classId={classData.id} />
                )}

                {/* Quick Participants Preview */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Participants</h3>
                      <span className="text-sm text-muted-foreground">{participants} registered</span>
                    </div>
                    <div className="space-y-2">
                      {Array.from({ length: Math.min(participants + 1, 4) }, (_, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                            {i === 0 ? 'H' : i}
                          </div>
                          <span className="text-muted-foreground">
                            {i === 0 ? 'Host' : `Participant ${i}`}
                          </span>
                        </div>
                      ))}
                      {participants > 3 && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          +{participants - 3} more
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        } else {
          // Class has ended
          return (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center p-8">
                <div className="text-6xl mb-6">📚</div>
                <h2 className="text-xl font-semibold mb-4">Class Has Ended</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  This class has concluded. Check the participants tab to see who attended, or browse other upcoming classes.
                </p>
              </CardContent>
            </Card>
          );
        }

      case 'about':
        return <ClassAbout classData={classData} participants={participants} />;

      case 'participants':
        return (
          <ClassParticipants 
            classId={classData.id} 
            hostUserId={classData.user_id} 
            participants={participants} 
          />
        );

      case 'discussion':
        return (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center p-8">
              <MessageSquare className="h-16 w-16 mx-auto mb-6 text-muted-foreground/50" />
              <h2 className="text-xl font-semibold mb-4">Class Discussion</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Discussion features coming soon! For now, use the video meeting platform for live discussions.
              </p>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollRestoreLayout>
      <div className="container mx-auto px-4 py-4 space-y-6 max-w-7xl">
        {/* Back Navigation */}
        <button 
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:gap-3 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Back to Classes</span>
        </button>

        {/* Class Header */}
        <ClassHeader
          classData={classData}
          participants={participants}
          isHost={isHost}
          isJoined={isJoined}
          joining={joining}
          onJoin={joinClass}
          onLeave={leaveClass}
        />

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">About</span>
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Participants</span>
            </TabsTrigger>
            <TabsTrigger value="discussion" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Discussion</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            <div className="min-h-[600px]">
              {renderTabContent()}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollRestoreLayout>
  );
};

export default LiveClass;
