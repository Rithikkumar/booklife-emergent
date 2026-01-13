// Supabase client configuration
// Uses environment variables for better security and flexibility
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Read from environment variables with fallback for development
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://dyzogjengmqoqnpfqnda.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5em9namVuZ21xb3FucGZxbmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTk2MDIsImV4cCI6MjA2ODg3NTYwMn0.qQ8A69mr-K7lc29S-govr2nYfdsVK_4Vozg3L8yg0Y0";

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});
