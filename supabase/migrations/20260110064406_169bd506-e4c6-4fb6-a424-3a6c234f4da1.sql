-- Add push_notification_token column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_notification_token TEXT;

-- Add notify_on_message column to profiles for message notification preferences
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notify_on_message BOOLEAN DEFAULT TRUE;

-- Create notifications table for in-app notification history
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('follow', 'message', 'book_class', 'community', 'story_reaction', 'story_comment')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- System can insert notifications for any user (via service role)
CREATE POLICY "Service role can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);

-- Create function to notify on new follower
CREATE OR REPLACE FUNCTION public.notify_on_new_follower()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  follower_username TEXT;
  follower_display_name TEXT;
BEGIN
  -- Get follower's name
  SELECT username, display_name INTO follower_username, follower_display_name
  FROM profiles WHERE user_id = NEW.follower_id;
  
  -- Insert notification record
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.following_id,
    'follow',
    'New Follower',
    COALESCE(follower_display_name, follower_username, 'Someone') || ' started following you',
    jsonb_build_object(
      'follower_id', NEW.follower_id,
      'follower_username', follower_username,
      'url', '/profile/' || follower_username
    )
  );
  
  -- Call edge function to send push notification
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := jsonb_build_object(
      'user_id', NEW.following_id,
      'type', 'follow',
      'title', 'New Follower',
      'body', COALESCE(follower_display_name, follower_username, 'Someone') || ' started following you',
      'data', jsonb_build_object(
        'follower_id', NEW.follower_id,
        'url', '/profile/' || follower_username
      )
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to send follow notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for new followers
DROP TRIGGER IF EXISTS on_new_follower ON public.followers;
CREATE TRIGGER on_new_follower
AFTER INSERT ON public.followers
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_follower();

-- Create function to notify on new direct message
CREATE OR REPLACE FUNCTION public.notify_on_new_direct_message()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sender_username TEXT;
  sender_display_name TEXT;
  recipient_id UUID;
  conv_participant_1 UUID;
  conv_participant_2 UUID;
BEGIN
  -- Get sender's name
  SELECT username, display_name INTO sender_username, sender_display_name
  FROM profiles WHERE user_id = NEW.sender_id;
  
  -- Get conversation participants to find recipient
  SELECT participant_1_id, participant_2_id INTO conv_participant_1, conv_participant_2
  FROM conversations WHERE id = NEW.conversation_id;
  
  -- Determine recipient (the other participant)
  IF conv_participant_1 = NEW.sender_id THEN
    recipient_id := conv_participant_2;
  ELSE
    recipient_id := conv_participant_1;
  END IF;
  
  -- Insert notification record
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    recipient_id,
    'message',
    'New Message',
    COALESCE(sender_display_name, sender_username, 'Someone') || ': ' || LEFT(NEW.content, 50),
    jsonb_build_object(
      'sender_id', NEW.sender_id,
      'conversation_id', NEW.conversation_id,
      'url', '/messages/' || NEW.conversation_id
    )
  );
  
  -- Call edge function to send push notification
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := jsonb_build_object(
      'user_id', recipient_id,
      'type', 'message',
      'title', 'New Message from ' || COALESCE(sender_display_name, sender_username, 'Someone'),
      'body', LEFT(NEW.content, 100),
      'data', jsonb_build_object(
        'sender_id', NEW.sender_id,
        'conversation_id', NEW.conversation_id,
        'url', '/messages/' || NEW.conversation_id
      )
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to send message notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for new direct messages
DROP TRIGGER IF EXISTS on_new_direct_message ON public.direct_messages;
CREATE TRIGGER on_new_direct_message
AFTER INSERT ON public.direct_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_direct_message();