import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Book, 
  Clock, 
  Calendar,
  Users,
  ExternalLink,
  MapPin
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
  category?: string;
  tags?: string[];
  host_name?: string;
}

interface ClassAboutProps {
  classData: ClassData;
  participants: number;
}

const ClassAbout: React.FC<ClassAboutProps> = ({ classData, participants }) => {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Class Description */}
      <Card>
        <CardHeader>
          <CardTitle>About This Class</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {classData.description || 'No description provided for this class.'}
          </p>
        </CardContent>
      </Card>

      {/* Book Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Featured Book
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {classData.book_cover_url && (
              <img
                src={classData.book_cover_url}
                alt={classData.book_title}
                className="w-20 h-28 object-cover rounded shadow-sm flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{classData.book_title}</h3>
              <p className="text-muted-foreground mb-3">by {classData.book_author}</p>
              <p className="text-sm text-muted-foreground">
                This class will focus on discussions and insights related to this book. 
                Consider reading it beforehand to get the most out of the session.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Details */}
      <Card>
        <CardHeader>
          <CardTitle>Class Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(classData.scheduled_date)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">
                  {classData.duration_minutes} minutes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Participants</p>
                <p className="text-sm text-muted-foreground">
                  {participants} / {classData.max_participants} registered
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ExternalLink className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Platform</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {classData.platform.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Category */}
          {classData.category && (
            <div className="pt-4 border-t">
              <p className="font-medium mb-2">Category</p>
              <Badge variant="secondary">{classData.category}</Badge>
            </div>
          )}

          {/* Tags */}
          {classData.tags && classData.tags.length > 0 && (
            <div className="pt-4 border-t">
              <p className="font-medium mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {classData.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Host Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Host Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/20 text-primary">
                {(classData.host_name || 'Host')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{classData.host_name || 'Class Host'}</p>
              <p className="text-sm text-muted-foreground">Class Instructor</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle>Prerequisites</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• A stable internet connection</li>
            <li>• Access to {classData.platform.replace('_', ' ')} platform</li>
            <li>• Optional: Read "{classData.book_title}" beforehand</li>
            <li>• Come with an open mind and ready to discuss!</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassAbout;