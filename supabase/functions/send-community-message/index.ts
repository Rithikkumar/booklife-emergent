import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting cache (in-memory, shared across requests)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Cleanup old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 300000);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with user JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { community_id, message, message_type, reply_to_id } = body;

    // Validate input
    if (!community_id || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: community_id and message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0 || trimmedMessage.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Message must be between 1 and 2000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: max 10 messages per minute per user per community
    const rateLimitKey = `${user.id}_${community_id}`;
    const now = Date.now();
    const userLimit = rateLimitMap.get(rateLimitKey);

    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= 10) {
          const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
          return new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded. Please wait before sending more messages.',
              retry_after: retryAfter
            }),
            { 
              status: 429, 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json',
                'Retry-After': retryAfter.toString()
              } 
            }
          );
        }
        userLimit.count++;
      } else {
        rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + 60000 }); // 1 minute window
      }
    } else {
      rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + 60000 });
    }

    // Verify user is member of community
    const { data: membership, error: memberError } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', community_id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      console.error('Membership error:', memberError);
      return new Response(
        JSON.stringify({ error: 'You must be a member of this community to send messages' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check messaging permissions
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('restrict_messaging, created_by')
      .eq('id', community_id)
      .single();

    if (communityError) {
      console.error('Community fetch error:', communityError);
      return new Response(
        JSON.stringify({ error: 'Community not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user can send messages in restricted communities
    if (community?.restrict_messaging && 
        membership.role !== 'admin' && 
        community.created_by !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Only admins can send messages in this community' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize message (basic XSS prevention)
    const sanitizedMessage = trimmedMessage
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Insert message to database
    const { data: insertedMessage, error: insertError } = await supabase
      .from('community_messages')
      .insert({
        community_id,
        user_id: user.id,
        message: sanitizedMessage,
        message_type: message_type || 'text',
        reply_to_id: reply_to_id || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to send message', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update member's last_active_at (fire and forget)
    supabase
      .from('community_members')
      .update({ last_active_at: new Date().toISOString() })
      .eq('community_id', community_id)
      .eq('user_id', user.id)
      .then(() => {
        console.log(`Updated last_active_at for user ${user.id} in community ${community_id}`);
      })
      .catch((error) => {
        console.error('Failed to update last_active_at:', error);
      });

    console.log(`Message sent successfully by ${user.id} in community ${community_id}`);

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: insertedMessage 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
