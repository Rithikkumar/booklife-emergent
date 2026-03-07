import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * Legacy route handler: redirects /messages/:conversationId to /messages?room=:id
 * This ensures old links/bookmarks still work after the messaging system migration.
 */
const MessageThread: React.FC = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (conversationId) {
      // Redirect to the unified messages page with room query param
      navigate(`/messages?room=${conversationId}`, { replace: true });
    } else {
      navigate('/messages', { replace: true });
    }
  }, [conversationId, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
};

export default MessageThread;