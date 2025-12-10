import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Clock, 
  Calendar,
  Book,
  ExternalLink,
  UserPlus,
  UserMinus,
  Crown
} from 'lucide-react';

interface ClassData {
  id: string;
  title: string;
  description: string;
  book_title: string;
  book_author: string;
  book_cover_url?: string;
  platform: string;
  platform_join_url: string;
  scheduled_date: string;
  duration_minutes: number;
  max_participants: number;
  status: string;
  host_name?: string;
}

interface ClassHeaderProps {
  classData: ClassData;
  participants: number;
  isHost: boolean;
  isJoined: boolean;
  joining: boolean;
  onJoin: () => void;
  onLeave: () => void;
}

const ClassHeader: React.FC<ClassHeaderProps> = ({
  classData,
  participants,
  isHost,
  isJoined,
  joining,
  onJoin,
  onLeave
}) => {
  const getClassInitials = (title: string) => {
    return title.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'upcoming':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    };
    
    return {
      date: date.toLocaleDateString('en-US', dateOptions),
      time: date.toLocaleTimeString('en-US', timeOptions)
    };
  };

  const { date, time } = formatDateTime(classData.scheduled_date);

  return (
    <Card className="overflow-hidden">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Class Avatar */}
          <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-background shadow-lg">
            <AvatarFallback className="text-2xl font-bold bg-primary/20 text-primary">
              {getClassInitials(classData.title)}
            </AvatarFallback>
          </Avatar>

          {/* Class Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground break-words">
                {classData.title}
              </h1>
              {isHost && (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                  <Crown className="h-3 w-3 mr-1" />
                  Host
                </Badge>
              )}
              <Badge variant="outline" className={getStatusColor(classData.status)}>
                {classData.status.toUpperCase()}
              </Badge>
            </div>

            <p className="text-muted-foreground mb-4 leading-relaxed max-w-2xl">
              {classData.description}
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="font-medium">{participants}</span>
                <span>/ {classData.max_participants} participants</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{time} ({classData.duration_minutes} min)</span>
              </div>
            </div>

            {/* Book Information */}
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
              {classData.book_cover_url && (
                <img
                  src={classData.book_cover_url}
                  alt={classData.book_title}
                  className="w-12 h-16 object-cover rounded shadow-sm"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Book className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Featured Book</span>
                </div>
                <h3 className="font-semibold text-foreground">{classData.book_title}</h3>
                <p className="text-sm text-muted-foreground">by {classData.book_author}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 w-full md:w-auto">
            <div className="flex flex-col gap-2 items-stretch">
              {/* Platform Access Button */}
              <Button
                variant="outline"
                size="lg"
                className="w-full md:w-auto min-w-[180px]"
                onClick={() => window.open(classData.platform_join_url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in {classData.platform.replace('_', ' ')}
              </Button>
              
              {/* Join/Leave Button */}
              {!isHost && (
                <Button
                  onClick={isJoined ? onLeave : onJoin}
                  disabled={joining}
                  variant={isJoined ? "outline" : "default"}
                  size="lg"
                  className="w-full md:w-auto min-w-[180px]"
                >
                  {joining ? (
                    "Processing..."
                  ) : isJoined ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Leave Class
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Class
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Registration Status Banner */}
        {isJoined && !isHost && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <Users className="h-4 w-4" />
              <span className="font-medium text-sm">
                You're registered for this class
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ClassHeader;