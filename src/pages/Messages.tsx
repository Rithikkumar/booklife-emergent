import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import ConversationsList from '@/components/messages/ConversationsList';
import MessageThreadContent from '@/components/messages/MessageThreadContent';
import EmptyConversationState from '@/components/messages/EmptyConversationState';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserSearchInput from '@/components/common/UserSearchInput';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { conversations, loading, refetchConversations } = useDirectMessages();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');

  // Extract conversationId from URL query params for desktop view
  const conversationId = new URLSearchParams(location.search).get('conversation');

  // Filter conversations based on search and active tab
  const filteredConversations = useMemo(() => {
    let filtered = conversations;
    
    // Apply tab filter
    if (activeTab === 'active') {
      // Show conversations with recent activity (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      filtered = conversations.filter((conv) => 
        conv.last_message_at && new Date(conv.last_message_at) > fiveMinutesAgo
      );
    } else if (activeTab === 'archived') {
      // TODO: Add archived flag to conversations table
      filtered = [];
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((conv) => {
        const name = conv.other_participant?.display_name?.toLowerCase() || '';
        const username = conv.other_participant?.username?.toLowerCase() || '';
        const lastMessage = conv.last_message?.toLowerCase() || '';
        
        return name.includes(query) || username.includes(query) || lastMessage.includes(query);
      });
    }
    
    return filtered;
  }, [conversations, searchQuery, activeTab]);

  const handleStartConversation = async (otherUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${otherUserId}),and(participant_1_id.eq.${otherUserId},participant_2_id.eq.${user.id})`)
        .maybeSingle();

      if (existingConversation) {
        setShowNewMessage(false);
        navigate(`/messages?conversation=${existingConversation.id}`);
        return;
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          participant_1_id: user.id,
          participant_2_id: otherUserId,
        })
        .select()
        .single();

      if (error) throw error;

      setShowNewMessage(false);
      await refetchConversations();
      navigate(`/messages?conversation=${newConversation.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-4 flex items-center justify-center">
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 pb-4 lg:pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Desktop: Split View */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
            {/* Left: Conversations List with Tabs */}
            <div className="col-span-4 border-r pr-4 flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-3 mb-4">
                  <TabsTrigger value="chats">Chats</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="archived">Archived</TabsTrigger>
                </TabsList>
                
                <TabsContent value="chats" className="flex-1 mt-0">
                  <ConversationsList
                    conversations={filteredConversations}
                    selectedId={conversationId}
                    onSelectConversation={(id) => navigate(`/messages?conversation=${id}`)}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onNewMessage={() => setShowNewMessage(true)}
                    isMobile={false}
                  />
                </TabsContent>
                
                <TabsContent value="active" className="flex-1 mt-0">
                  <ConversationsList
                    conversations={filteredConversations}
                    selectedId={conversationId}
                    onSelectConversation={(id) => navigate(`/messages?conversation=${id}`)}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onNewMessage={() => setShowNewMessage(true)}
                    isMobile={false}
                  />
                </TabsContent>
                
                <TabsContent value="archived" className="flex-1 mt-0">
                  <div className="text-center text-muted-foreground py-8">
                    No archived conversations
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right: Message Thread */}
            <div className="col-span-8">
              {conversationId ? (
                <MessageThreadContent
                  conversationId={conversationId}
                  showBackButton={false}
                />
              ) : (
                <EmptyConversationState />
              )}
            </div>
          </div>

          {/* Mobile/Tablet: Full Screen List with Tabs */}
          <div className="lg:hidden h-[calc(100vh-100px)]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="w-full grid grid-cols-3 mb-4">
                <TabsTrigger value="chats">Chats</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chats" className="flex-1 mt-0">
                <ConversationsList
                  conversations={filteredConversations}
                  onSelectConversation={(id) => navigate(`/messages/${id}`)}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onNewMessage={() => setShowNewMessage(true)}
                  isMobile={true}
                />
              </TabsContent>
              
              <TabsContent value="active" className="flex-1 mt-0">
                <ConversationsList
                  conversations={filteredConversations}
                  onSelectConversation={(id) => navigate(`/messages/${id}`)}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onNewMessage={() => setShowNewMessage(true)}
                  isMobile={true}
                />
              </TabsContent>
              
              <TabsContent value="archived" className="flex-1 mt-0">
                <div className="text-center text-muted-foreground py-8">
                  No archived conversations
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* New Message Dialog */}
      <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <UserSearchInput
              onUserSelect={handleStartConversation}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;
