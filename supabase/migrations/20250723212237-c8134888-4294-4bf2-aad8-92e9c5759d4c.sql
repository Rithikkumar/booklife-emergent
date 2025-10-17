-- Delete the incorrectly created user first
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';
DELETE FROM public.profiles WHERE user_id = '00000000-0000-0000-0000-000000000001';