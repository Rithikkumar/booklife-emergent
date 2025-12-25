-- Create email notifications tracking table
CREATE TABLE IF NOT EXISTS public.email_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.book_classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    email_type TEXT NOT NULL CHECK (email_type IN ('confirmation', 'reminder_24h', 'reminder_1h')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Prevent duplicate emails of the same type to the same user for the same class
    UNIQUE(class_id, user_id, email_type)
);

-- Create indexes for efficient querying
CREATE INDEX idx_email_notifications_class_id ON public.email_notifications(class_id);
CREATE INDEX idx_email_notifications_user_id ON public.email_notifications(user_id);
CREATE INDEX idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX idx_email_notifications_email_type ON public.email_notifications(email_type);

-- Enable RLS
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can view their own email notifications
CREATE POLICY "Users can view their own email notifications"
ON public.email_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role can manage all email notifications"
ON public.email_notifications
FOR ALL
USING (auth.role() = 'service_role');

-- Create function to send confirmation email on class join
CREATE OR REPLACE FUNCTION public.trigger_confirmation_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Call the edge function to send confirmation email
    -- This uses pg_net extension for async HTTP calls
    PERFORM net.http_post(
        url := 'https://dyzogjengmqoqnpfqnda.supabase.co/functions/v1/send-class-email',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
        ),
        body := jsonb_build_object(
            'type', 'confirmation',
            'classId', NEW.class_id::text,
            'userId', NEW.user_id::text
        )
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE WARNING 'Failed to trigger confirmation email: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Create trigger for automatic confirmation emails
DROP TRIGGER IF EXISTS on_class_participant_joined ON public.class_participants;
CREATE TRIGGER on_class_participant_joined
    AFTER INSERT ON public.class_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_confirmation_email();

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP calls from database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the reminder check to run every 30 minutes
SELECT cron.schedule(
    'process-class-reminders',
    '*/30 * * * *', -- Every 30 minutes
    $$
    SELECT net.http_post(
        url := 'https://dyzogjengmqoqnpfqnda.supabase.co/functions/v1/process-class-reminders',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    ) as request_id;
    $$
);

-- Add comment for documentation
COMMENT ON TABLE public.email_notifications IS 'Tracks email notifications sent for book classes (confirmations and reminders)';