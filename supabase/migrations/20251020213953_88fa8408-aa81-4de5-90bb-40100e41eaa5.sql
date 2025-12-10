-- Create conversations table for direct messaging
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT different_participants CHECK (participant_1_id != participant_2_id),
  CONSTRAINT unique_conversation UNIQUE (participant_1_id, participant_2_id)
);

-- Create index for faster lookups
CREATE INDEX idx_conversations_participant_1 ON public.conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON public.conversations(participant_2_id);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- Create direct_messages table
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  reply_to_id UUID REFERENCES public.direct_messages(id) ON DELETE SET NULL,
  reactions JSONB DEFAULT '{}'::jsonb,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT message_not_empty CHECK (length(trim(message)) > 0),
  CONSTRAINT message_max_length CHECK (length(message) <= 2000)
);

-- Create indexes for direct_messages
CREATE INDEX idx_direct_messages_conversation ON public.direct_messages(conversation_id, created_at DESC);
CREATE INDEX idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX idx_direct_messages_unread ON public.direct_messages(conversation_id, is_read) WHERE is_read = false;

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
-- Users can view conversations they're part of
CREATE POLICY "Users can view their own conversations"
  ON public.conversations
  FOR SELECT
  USING (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

-- Users can create conversations (will be created automatically when first message is sent)
CREATE POLICY "Users can create conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

-- Users can update conversations they're part of (for last_message_at)
CREATE POLICY "Users can update their conversations"
  ON public.conversations
  FOR UPDATE
  USING (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

-- RLS Policies for direct_messages
-- Users can view messages in conversations they're part of
CREATE POLICY "Users can view messages in their conversations"
  ON public.direct_messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    )
  );

-- Users can send messages in conversations they're part of
CREATE POLICY "Users can send messages in their conversations"
  ON public.direct_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    )
  );

-- Users can update their own messages (for editing)
CREATE POLICY "Users can update their own messages"
  ON public.direct_messages
  FOR UPDATE
  USING (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON public.direct_messages
  FOR DELETE
  USING (sender_id = auth.uid());

-- Function to update conversation's last_message_at timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Trigger to update conversation timestamp when a message is sent
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- Function to update message edited tracking
CREATE OR REPLACE FUNCTION public.update_message_edit_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update if the message content has changed
  IF OLD.message IS DISTINCT FROM NEW.message THEN
    NEW.is_edited = TRUE;
    NEW.edited_at = now();
  END IF;
  
  -- Always update the updated_at timestamp
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for message edit tracking
CREATE TRIGGER track_message_edits
  BEFORE UPDATE ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_message_edit_tracking();

-- Function to get or create conversation between two users
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conversation_id UUID;
  min_id UUID;
  max_id UUID;
BEGIN
  -- Ensure consistent ordering to avoid duplicate conversations
  IF user1_id < user2_id THEN
    min_id := user1_id;
    max_id := user2_id;
  ELSE
    min_id := user2_id;
    max_id := user1_id;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM public.conversations
  WHERE (participant_1_id = min_id AND participant_2_id = max_id)
     OR (participant_1_id = max_id AND participant_2_id = min_id);

  -- If no conversation exists, create one
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant_1_id, participant_2_id)
    VALUES (min_id, max_id)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$;

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;