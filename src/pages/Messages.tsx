import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import { ChatRoomList, ChatContainer, NewChatDialog, CreateGroupDialog } from '@/components/chat';
import EmptyConversationState from '@/components/messages/EmptyConversationState';
import { Button } from '@/components/ui/button';
import { Users, MessageCircle } from 'lucide-react';

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);

  // Extract roomId from URL query params for desktop view
  const roomId = new URLSearchParams(location.search).get('room');

  const handleSelectRoom = (id: string) => {
    navigate(`/messages?room=${id}`);
  };

  const handleChatCreated = (roomId: string) => {
    setShowNewChat(false);
    navigate(`/messages?room=${roomId}`);
  };

  const handleGroupCreated = (roomId: string) => {
    setShowNewGroup(false);
    navigate(`/messages?room=${roomId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 pb-4 lg:pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Desktop: Split View */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
            {/* Left: Chat Room List */}
            <div className="col-span-4 border-r pr-4 flex flex-col">
              {/* Header with new chat/group buttons */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Messages</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewChat(true)}
                    className="gap-1"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="hidden xl:inline">New Chat</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewGroup(true)}
                    className="gap-1"
                  >
                    <Users className="h-4 w-4" />
                    <span className="hidden xl:inline">New Group</span>
                  </Button>
                </div>
              </div>
              
              <ChatRoomList
                selectedRoomId={roomId || undefined}
                onSelectRoom={handleSelectRoom}
                onNewChat={() => setShowNewChat(true)}
                onNewGroup={() => setShowNewGroup(true)}
                className="flex-1"
              />
            </div>

            {/* Right: Chat Container */}
            <div className="col-span-8">
              {roomId ? (
                <ChatContainer
                  roomId={roomId}
                  roomType="direct"
                  onBack={() => navigate('/messages')}
                />
              ) : (
                <EmptyConversationState />
              )}
            </div>
          </div>

          {/* Mobile/Tablet: Full Screen List */}
          <div className="lg:hidden h-[calc(100vh-100px)]">
            {/* Header with new chat/group buttons */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Messages</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewChat(true)}
                  className="gap-1"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewGroup(true)}
                  className="gap-1"
                >
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <ChatRoomList
              selectedRoomId={roomId || undefined}
              onSelectRoom={(id) => navigate(`/messages/${id}`)}
              onNewChat={() => setShowNewChat(true)}
              onNewGroup={() => setShowNewGroup(true)}
              className="h-[calc(100%-60px)]"
            />
          </div>
        </div>
      </div>

      {/* New Chat Dialog */}
      <NewChatDialog
        open={showNewChat}
        onOpenChange={setShowNewChat}
        onChatCreated={handleChatCreated}
      />

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={showNewGroup}
        onOpenChange={setShowNewGroup}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
};

export default Messages;
