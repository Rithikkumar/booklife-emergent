-- Enable real-time for community tables
ALTER TABLE public.community_messages REPLICA IDENTITY FULL;
ALTER TABLE public.community_typing_indicators REPLICA IDENTITY FULL;

-- Add these tables to the realtime publication
ALTER publication supabase_realtime ADD TABLE public.community_messages;
ALTER publication supabase_realtime ADD TABLE public.community_typing_indicators;