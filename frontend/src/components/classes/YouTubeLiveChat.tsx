import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare, Pin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  message_type: 'chat' | 'question' | 'system';
  created_at: string;
  user_name?: string;
}

interface YouTubeLiveChatProps {
  classId: string;
  className?: string;
}

const YouTubeLiveChat: React.FC<YouTubeLiveChatProps> = ({ classId, className }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isQuestion, setIsQuestion] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load existing messages
    loadMessages();
    
    // Subscribe to real-time messages
    const channel = supabase
      .channel(`class-chat-${classId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'class_chat_messages',
          filter: `class_id=eq.${classId}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classId]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('class_chat_messages')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as ChatMessage[]) || []);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to send messages.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('class_chat_messages')
        .insert({
          class_id: classId,
          user_id: user.id,
          message: newMessage.trim(),
          message_type: isQuestion ? 'question' : 'chat'
        });

      if (error) throw error;

      setNewMessage('');
      setIsQuestion(false);
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'question':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'system':
        return 'bg-gray-100 border-gray-300 text-gray-600';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getUserInitials = (userId: string) => {
    return userId.substring(0, 2).toUpperCase();
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Live Chat</span>
          <Badge variant="secondary" className="text-xs">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Messages Area */}
        <ScrollArea className="h-64 w-full border rounded-lg p-3">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Be the first to say something!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg border ${getMessageTypeColor(message.message_type)}`}
                >
                  <div className="flex items-start space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getUserInitials(message.user_id)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium">
                          {message.user_name || 'User'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.created_at)}
                        </span>
                        {message.message_type === 'question' && (
                          <Badge variant="outline" className="text-xs">
                            <Pin className="h-3 w-3 mr-1" />
                            Question
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm break-words">{message.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Button
              variant={isQuestion ? "default" : "outline"}
              size="sm"
              onClick={() => setIsQuestion(!isQuestion)}
              className="text-xs"
            >
              <Pin className="h-3 w-3 mr-1" />
              Question
            </Button>
            {isQuestion && (
              <Badge variant="secondary" className="text-xs">
                This will be marked as a question
              </Badge>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Input
              placeholder={isQuestion ? "Ask a question..." : "Type a message..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat Guidelines */}
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
          <p className="font-medium mb-1">Chat Guidelines:</p>
          <ul className="space-y-1">
            <li>• Be respectful and constructive</li>
            <li>• Use the Question button for questions to the instructor</li>
            <li>• Keep messages relevant to the class content</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default YouTubeLiveChat;