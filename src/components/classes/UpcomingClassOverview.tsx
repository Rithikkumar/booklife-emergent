import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, ExternalLink } from 'lucide-react';
import { formatClassTime, formatTimeUntilClass, getClassStatus } from '@/utils/classTime';

interface UpcomingClassOverviewProps {
  classData: {
    id: string;
    title: string;
    scheduled_date: string;
    duration_minutes: number;
    platform: string;
    platform_join_url: string;
  };
  participants: number;
  isJoined: boolean;
}

const UpcomingClassOverview: React.FC<UpcomingClassOverviewProps> = ({
  classData,
  participants,
  isJoined
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const status = getClassStatus(classData.scheduled_date, classData.duration_minutes);

  const addToCalendar = () => {
    const startDate = new Date(classData.scheduled_date);
    const endDate = new Date(startDate.getTime() + classData.duration_minutes * 60000);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const details = `Book class: ${classData.title}`;
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(classData.title)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(details)}`;
    
    window.open(calendarUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Class Schedule
            </CardTitle>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {status.isUpcoming ? `Starts in ${formatTimeUntilClass(status.startsIn)}` : 'Ready to join'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">{formatClassTime(classData.scheduled_date)}</h3>
            <p className="text-muted-foreground">
              Duration: {classData.duration_minutes} minutes
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              Platform: {classData.platform.replace('_', ' ')}
            </p>
          </div>

          {status.isUpcoming && (
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Class starts in</h4>
              <div className="text-3xl font-bold text-primary">
                {formatTimeUntilClass(status.startsIn)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                You can join 15 minutes before the scheduled time
              </p>
            </div>
          )}

          {!status.isUpcoming && status.isLive && (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <Badge variant="destructive" className="animate-pulse mb-2">
                LIVE NOW
              </Badge>
              <p className="text-sm">Class is now live! Click join to participate.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants
            </span>
            <span className="font-medium">{participants} registered</span>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={addToCalendar}
              variant="outline" 
              className="w-full"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Add to Calendar
            </Button>
            
            {isJoined && !status.isUpcoming && (
              <Button 
                onClick={() => window.open(classData.platform_join_url, '_blank')}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Join Meeting
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preparation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Before the Class</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p>Make sure you have a stable internet connection</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p>Test your microphone and camera beforehand</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p>Have the book ready for discussion</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p>Join 5-10 minutes early to resolve any technical issues</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpcomingClassOverview;