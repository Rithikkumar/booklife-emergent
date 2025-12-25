import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Video, Clock, Users, Calendar, BookOpen, Play, Edit, Check } from "lucide-react";
import EditClassDialog from "./EditClassDialog";

interface ClassCardProps {
  classItem: {
    id: string;
    title: string;
    description?: string | null;
    book_title?: string | null;
    book_author?: string | null;
    book_cover_url?: string | null;
    category?: string | null;
    tags?: string[] | null;
    scheduled_date?: string | null;
    duration_minutes?: number | null;
    max_participants?: number | null;
    platform?: string;
    platform_join_url?: string | null;
    status?: string | null;
    host_name?: string;
    host_username?: string;
    host_user_id?: string;
    participant_count?: number;
    is_ongoing?: boolean;
    show_participant_count?: boolean;
  };
  onJoin?: (classId: string, joinUrl?: string, isLive?: boolean) => void;
  showHost?: boolean;
  variant?: 'default' | 'compact';
  isOwner?: boolean;
  isJoined?: boolean;
}

const ClassCard: React.FC<ClassCardProps> = ({ 
  classItem, 
  onJoin, 
  showHost = true,
  variant = 'default',
  isOwner = false,
  isJoined = false
}) => {
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const formatScheduledTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    const now = new Date();
    
    if (date > now) {
      return `Starting ${formatDistanceToNow(date, { addSuffix: true })}`;
    } else {
      return `Started ${formatDistanceToNow(date, { addSuffix: true })}`;
    }
  };

  const isLive = classItem.status === 'live' || classItem.is_ongoing;
  
  // Show participant count if owner OR if show_participant_count setting is true (or undefined = default visible)
  const shouldShowParticipantCount = isOwner || (classItem.show_participant_count !== false);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return;
    }
    navigate(`/class/${classItem.id}`);
  };

  if (variant === 'compact') {
    return (
      <Card 
        className="shadow-card hover:shadow-elegant transition-all duration-300 cursor-pointer"
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-sm leading-tight">{classItem.title}</h3>
            {isLive && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-2 mt-1 flex-shrink-0" />
            )}
          </div>
          
          {showHost && classItem.host_name && (
            <p className="text-xs text-muted-foreground mb-2">
              by {classItem.host_name}
            </p>
          )}
          
          {classItem.book_title && (
            <div className="text-xs text-muted-foreground mb-2 flex items-center">
              <BookOpen className="h-3 w-3 mr-1" />
              {classItem.book_title}
            </div>
          )}
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">
              {formatScheduledTime(classItem.scheduled_date)}
            </span>
            {shouldShowParticipantCount && (
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {classItem.participant_count || 0}
              </Badge>
            )}
          </div>
          
          {isOwner ? (
            <Button 
              size="sm" 
              variant="outline"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                setEditDialogOpen(true);
              }}
            >
              <Edit className="h-3 w-3 mr-2" />
              Edit
            </Button>
          ) : isJoined ? (
            <Button 
              size="sm" 
              variant="secondary"
              className="w-full"
              disabled
            >
              <Check className="h-3 w-3 mr-2" />
              Joined
            </Button>
          ) : onJoin && (
            <Button 
              size="sm" 
              className={`w-full ${isLive ? 'bg-gradient-primary' : ''}`}
              variant={isLive ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                onJoin(classItem.id, classItem.platform_join_url || undefined, isLive);
              }}
            >
              {isLive ? (
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
          )}
        </CardContent>

        <EditClassDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          classData={classItem}
        />
      </Card>
    );
  }

  return (
    <Card 
      className="shadow-card hover:shadow-elegant transition-all duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{classItem.title}</CardTitle>
            {showHost && classItem.host_name && (
              <div className="flex items-center space-x-2 mb-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">
                    {classItem.host_name?.split(' ').map(n => n[0]).join('') || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{classItem.host_name}</p>
                  {classItem.host_username && (
                    <p className="text-xs text-muted-foreground">@{classItem.host_username}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          {isLive && (
            <Badge variant="destructive" className="text-xs">
              <div className="w-1 h-1 bg-white rounded-full mr-1 animate-pulse" />
              Live
            </Badge>
          )}
          {classItem.status === 'draft' && (
            <Badge variant="secondary" className="text-xs">Draft</Badge>
          )}
        </div>
        {classItem.description && (
          <CardDescription>{classItem.description}</CardDescription>
        )}
        
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
            {shouldShowParticipantCount && (
              <span className="flex items-center">
                <Users className="h-3 w-3 mr-1" />
                {classItem.participant_count || 0}/{classItem.max_participants || 20}
              </span>
            )}
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
            {classItem.platform && <p>Platform: {classItem.platform}</p>}
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
            {isOwner ? (
              <Button 
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditDialogOpen(true);
                }}
              >
                <Edit className="h-3 w-3 mr-2" />
                Edit Class
              </Button>
            ) : isJoined ? (
              <Button 
                size="sm"
                variant="secondary"
                disabled
              >
                <Check className="h-3 w-3 mr-2" />
                Joined
              </Button>
            ) : onJoin && (
              <Button 
                className={`${isLive ? 'bg-gradient-primary' : ''}`}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onJoin(classItem.id, classItem.platform_join_url || undefined, isLive);
                }}
              >
                {isLive ? 'Join Live' : 'Register'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <EditClassDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        classData={classItem}
      />
    </Card>
  );
};

export default ClassCard;
