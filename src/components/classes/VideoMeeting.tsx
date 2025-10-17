import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Video, VideoOff, Users, Settings, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoMeetingProps {
  platform: string;
  meetingId: string;
  isHost: boolean;
  className?: string;
  onLeave?: () => void;
}

const VideoMeeting: React.FC<VideoMeetingProps> = ({ 
  platform, 
  meetingId, 
  isHost, 
  className,
  onLeave 
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [participants, setParticipants] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize the specific platform SDK
    const initializeMeeting = async () => {
      setIsLoading(true);
      
      try {
        switch (platform) {
          case 'zoom':
            await initializeZoom();
            break;
          case 'webex':
            await initializeWebex();
            break;
          case 'google_meet':
            await initializeGoogleMeet();
            break;
          case 'youtube_live':
            await initializeYouTubeLive();
            break;
        }
      } catch (error) {
        console.error('Failed to initialize meeting:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMeeting();
  }, [platform, meetingId]);

  const initializeZoom = async () => {
    // Zoom Web SDK initialization
    if (videoRef.current) {
      // Clear existing content
      videoRef.current.textContent = '';
      
      // Create elements safely using DOM methods
      const container = document.createElement('div');
      container.className = 'w-full h-full bg-gray-900 rounded-lg flex items-center justify-center';
      
      const textContainer = document.createElement('div');
      textContainer.className = 'text-white text-center';
      
      const avatar = document.createElement('div');
      avatar.className = 'w-32 h-32 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center';
      
      const avatarText = document.createElement('span');
      avatarText.className = 'text-2xl font-bold';
      avatarText.textContent = 'YOU';
      
      const statusText = document.createElement('p');
      statusText.className = 'text-sm';
      statusText.textContent = 'Zoom Meeting Active';
      
      avatar.appendChild(avatarText);
      textContainer.appendChild(avatar);
      textContainer.appendChild(statusText);
      container.appendChild(textContainer);
      videoRef.current.appendChild(container);
    }
  };

  const initializeWebex = async () => {
    // WebEx SDK initialization
    if (videoRef.current) {
      // Clear existing content
      videoRef.current.textContent = '';
      
      // Create elements safely using DOM methods
      const container = document.createElement('div');
      container.className = 'w-full h-full bg-gray-900 rounded-lg flex items-center justify-center';
      
      const textContainer = document.createElement('div');
      textContainer.className = 'text-white text-center';
      
      const avatar = document.createElement('div');
      avatar.className = 'w-32 h-32 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center';
      
      const avatarText = document.createElement('span');
      avatarText.className = 'text-2xl font-bold';
      avatarText.textContent = 'YOU';
      
      const statusText = document.createElement('p');
      statusText.className = 'text-sm';
      statusText.textContent = 'WebEx Meeting Active';
      
      avatar.appendChild(avatarText);
      textContainer.appendChild(avatar);
      textContainer.appendChild(statusText);
      container.appendChild(textContainer);
      videoRef.current.appendChild(container);
    }
  };

  const initializeGoogleMeet = async () => {
    // Google Meet integration
    if (videoRef.current) {
      // Clear existing content
      videoRef.current.textContent = '';
      
      // Create elements safely using DOM methods
      const container = document.createElement('div');
      container.className = 'w-full h-full bg-gray-900 rounded-lg flex items-center justify-center';
      
      const textContainer = document.createElement('div');
      textContainer.className = 'text-white text-center';
      
      const avatar = document.createElement('div');
      avatar.className = 'w-32 h-32 bg-red-600 rounded-full mx-auto mb-4 flex items-center justify-center';
      
      const avatarText = document.createElement('span');
      avatarText.className = 'text-2xl font-bold';
      avatarText.textContent = 'YOU';
      
      const statusText = document.createElement('p');
      statusText.className = 'text-sm';
      statusText.textContent = 'Google Meet Active';
      
      avatar.appendChild(avatarText);
      textContainer.appendChild(avatar);
      textContainer.appendChild(statusText);
      container.appendChild(textContainer);
      videoRef.current.appendChild(container);
    }
  };

  const initializeYouTubeLive = async () => {
    // YouTube Live streaming
    if (videoRef.current) {
      // Clear existing content
      videoRef.current.textContent = '';
      
      // Create elements safely using DOM methods
      const container = document.createElement('div');
      container.className = 'w-full h-full bg-gray-900 rounded-lg flex items-center justify-center';
      
      const textContainer = document.createElement('div');
      textContainer.className = 'text-white text-center';
      
      const avatar = document.createElement('div');
      avatar.className = 'w-32 h-32 bg-red-600 rounded-full mx-auto mb-4 flex items-center justify-center';
      
      const avatarText = document.createElement('span');
      avatarText.className = 'text-2xl font-bold';
      avatarText.textContent = 'LIVE';
      
      const statusText = document.createElement('p');
      statusText.className = 'text-sm';
      statusText.textContent = 'YouTube Live Streaming';
      
      avatar.appendChild(avatarText);
      textContainer.appendChild(avatar);
      textContainer.appendChild(statusText);
      container.appendChild(textContainer);
      videoRef.current.appendChild(container);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Platform-specific mute logic would go here
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    // Platform-specific video toggle logic would go here
  };

  const handleLeave = () => {
    // Cleanup meeting resources
    onLeave?.();
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Connecting to meeting...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Video className="h-5 w-5" />
            <span className="capitalize">{platform.replace('_', ' ')} Meeting</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{participants}</span>
            </Badge>
            {platform === 'youtube_live' && (
              <Badge variant="destructive" className="animate-pulse">
                LIVE
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Video Container */}
        <div 
          ref={videoRef}
          className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden"
        />

        {/* Meeting Controls */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="icon"
            onClick={toggleMute}
            className="rounded-full"
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          <Button
            variant={isVideoOn ? "secondary" : "destructive"}
            size="icon"
            onClick={toggleVideo}
            className="rounded-full"
          >
            {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>

          {isHost && (
            <Button variant="outline" size="icon" className="rounded-full">
              <Settings className="h-4 w-4" />
            </Button>
          )}

          {platform === 'youtube_live' && (
            <Button variant="outline" size="icon" className="rounded-full">
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}

          <Button 
            variant="destructive" 
            onClick={handleLeave}
            className="px-4"
          >
            Leave
          </Button>
        </div>

        {/* Meeting Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Meeting ID: {meetingId}</p>
          {isHost && <p>You are the host</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoMeeting;