import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Crown, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Participant {
  id: string;
  user_id: string;
  joined_at: string;
  status: string;
  profile: {
    username: string;
    display_name: string | null;
  } | null;
}

interface ClassParticipantsProps {
  classId: string;
  hostUserId: string;
  participants: number;
}

const ClassParticipants: React.FC<ClassParticipantsProps> = ({ 
  classId, 
  hostUserId, 
  participants 
}) => {
  const [participantsList, setParticipantsList] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setLoading(true);
        
        // Fetch participants with their profiles
        const { data, error } = await supabase
          .from('class_participants')
          .select(`
            id,
            user_id,
            joined_at,
            status
          `)
          .eq('class_id', classId)
          .order('joined_at', { ascending: true });

        if (error) throw error;

        // Fetch profiles for each participant
        const participantsWithProfiles = await Promise.all(
          (data || []).map(async (participant) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, display_name')
              .eq('user_id', participant.user_id)
              .single();

            return {
              ...participant,
              profile
            };
          })
        );

        setParticipantsList(participantsWithProfiles);
      } catch (error) {
        console.error('Error fetching participants:', error);
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchParticipants();
    }
  }, [classId]);

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants ({participants})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participants ({participants})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Host - Always show first */}
          <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-yellow-500/20 text-yellow-700">
                <Crown className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-yellow-700">Class Host</p>
              <p className="text-xs text-yellow-600">Instructor</p>
            </div>
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
              Host
            </Badge>
          </div>

          {/* Participants */}
          {participantsList.length > 0 ? (
            <div className="space-y-3">
              {participantsList.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {participant.profile ? 
                        getInitials(participant.profile.display_name || participant.profile.username) : 
                        <User className="h-4 w-4" />
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">
                      {participant.profile?.display_name || participant.profile?.username || 'Unknown User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatJoinDate(participant.joined_at)}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      participant.status === 'registered' 
                        ? 'bg-green-500/10 text-green-700 border-green-500/20' 
                        : 'bg-gray-500/10 text-gray-700 border-gray-500/20'
                    }
                  >
                    {participant.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No participants have joined yet</p>
              <p className="text-sm">Be the first to register for this class!</p>
            </div>
          )}

          {/* Capacity indicator */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Class Capacity</span>
              <span className="font-medium">
                {participants} / {participants + 10} {/* Placeholder max */}
              </span>
            </div>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min((participants / (participants + 10)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassParticipants;