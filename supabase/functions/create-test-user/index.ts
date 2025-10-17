// Deno Edge Function to ensure a test user exists
// Endpoint: /functions/v1/create-test-user
// It creates a confirmed user: email=test@example.com, password=test
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing Supabase env" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Define test users
  const testUsers = [
    {
      email: "alice@example.com",
      password: "test123",
      user_metadata: { username: "alice", display_name: "Alice Cooper", location: "New York" }
    },
    {
      email: "bob@example.com", 
      password: "test123",
      user_metadata: { username: "bob", display_name: "Bob Martin", location: "Paris" }
    },
    {
      email: "carol@example.com",
      password: "test123", 
      user_metadata: { username: "carol", display_name: "Carol Smith", location: "Tokyo" }
    }
  ];

  try {
    console.log("create-test-user invoked - creating 3 test users");
    const results = [];

    for (const userData of testUsers) {
      const { data, error } = await admin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: userData.user_metadata,
      });

      if (error) {
        // If user already exists, treat as success
        if (String(error.message).toLowerCase().includes("already") || (error as any).status === 422) {
          console.log(`User ${userData.email} already exists`);
          results.push({ email: userData.email, created: false, message: "Already exists" });
        } else {
          console.error(`Failed to create user ${userData.email}:`, error);
          results.push({ email: userData.email, created: false, error: error.message });
        }
      } else {
        console.log(`Successfully created user ${userData.email}`);
        results.push({ email: userData.email, created: true, user_id: data.user.id });
      }
    }

    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: "Test users creation completed",
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
