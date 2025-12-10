import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import MessageThreadContent from '@/components/messages/MessageThreadContent';

const MessageThread: React.FC = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Desktop: redirect to split view with query param
  useEffect(() => {
    if (!isMobile && conversationId) {
      navigate(`/messages?conversation=${conversationId}`, { replace: true });
    }
  }, [conversationId, isMobile, navigate]);

  // Mobile: show full screen thread
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  if (!conversationId) {
    navigate('/messages');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 pb-4 px-4 h-screen">
        <div className="h-[calc(100vh-100px)]">
          <MessageThreadContent
            conversationId={conversationId}
            showBackButton={true}
            onBack={() => navigate('/messages')}
          />
        </div>
      </div>
    </div>
  );
};

export default MessageThread;
