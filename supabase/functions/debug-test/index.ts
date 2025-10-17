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

  console.log("SUPABASE_URL:", SUPABASE_URL);
  console.log("SERVICE_ROLE_KEY exists:", !!SERVICE_ROLE_KEY);

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing Supabase env" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Test 1: Check profiles
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('user_id, username')
      .limit(3);

    console.log("Profiles test:", { profiles, profilesError });

    if (profilesError) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "Failed to fetch profiles", 
          details: profilesError 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test 2: Try to insert a single book
    const testUser = profiles?.[0];
    if (!testUser) {
      return new Response(
        JSON.stringify({ ok: false, error: "No test users found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: insertResult, error: insertError } = await admin
      .from('user_books')
      .insert({
        user_id: testUser.user_id,
        title: "Debug Test Book",
        author: "Debug Author",
        genre: "Test",
        city: "New York",
        latitude: 40.7128,
        longitude: -74.0060,
        notes: "This is a debug test"
      })
      .select();

    console.log("Insert test:", { insertResult, insertError });

    return new Response(
      JSON.stringify({ 
        ok: true,
        profilesFound: profiles?.length || 0,
        insertResult: insertResult,
        insertError: insertError
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("Debug error:", e);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});