-- Add notification columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS push_notifications boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_on_follow boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_book_class boolean DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN profiles.email_notifications IS 'Whether user wants to receive email notifications';
COMMENT ON COLUMN profiles.push_notifications IS 'Whether user wants to receive push notifications';
COMMENT ON COLUMN profiles.notify_on_follow IS 'Whether user wants notifications when someone follows them';
COMMENT ON COLUMN profiles.notify_on_book_class IS 'Whether user wants notifications about book class updates';