import React from 'react';
import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const EmptyConversationState: React.FC = () => {
  return (
    <Card className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
      <p className="text-muted-foreground">
        Choose a conversation from the list to start messaging
      </p>
    </Card>
  );
};

export default EmptyConversationState;
