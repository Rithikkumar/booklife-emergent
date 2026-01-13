import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  user_id: string;
  type: 'follow' | 'message' | 'book_class' | 'community' | 'story_reaction' | 'story_comment';
  title: string;
  body: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    const { user_id, type, title, body, data } = payload;

    console.log(`[send-push-notification] Processing notification for user: ${user_id}, type: ${type}`);

    if (!user_id || !type || !title || !body) {
      console.error('[send-push-notification] Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, type, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's profile to check notification preferences and get push token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('push_notification_token, push_notifications, notify_on_follow, notify_on_book_class, notify_on_message')
      .eq('user_id', user_id)
      .single();

    if (profileError) {
      console.error('[send-push-notification] Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'User not found', details: profileError.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if push notifications are enabled globally
    if (!profile.push_notifications) {
      console.log(`[send-push-notification] Push notifications disabled for user: ${user_id}`);
      return new Response(
        JSON.stringify({ success: false, reason: 'Push notifications disabled by user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check type-specific notification preferences
    const preferenceMap: Record<string, string> = {
      'follow': 'notify_on_follow',
      'message': 'notify_on_message',
      'book_class': 'notify_on_book_class',
    };

    const preferenceKey = preferenceMap[type];
    if (preferenceKey && profile[preferenceKey] === false) {
      console.log(`[send-push-notification] ${type} notifications disabled for user: ${user_id}`);
      return new Response(
        JSON.stringify({ success: false, reason: `${type} notifications disabled by user` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has a push token
    if (!profile.push_notification_token) {
      console.log(`[send-push-notification] No push token for user: ${user_id}`);
      return new Response(
        JSON.stringify({ success: false, reason: 'No push token registered for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get FCM server key
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    
    if (!fcmServerKey) {
      console.warn('[send-push-notification] FCM_SERVER_KEY not configured, skipping push');
      return new Response(
        JSON.stringify({ 
          success: false, 
          reason: 'FCM not configured',
          notification_logged: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notification via FCM
    console.log(`[send-push-notification] Sending FCM notification to token: ${profile.push_notification_token.substring(0, 20)}...`);
    
    const fcmPayload = {
      to: profile.push_notification_token,
      notification: {
        title,
        body,
        sound: 'default',
        badge: 1,
      },
      data: {
        ...data,
        type,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // For Capacitor/Cordova apps
      },
      priority: 'high',
      content_available: true, // For iOS background notifications
    };

    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fcmPayload),
    });

    const fcmResult = await fcmResponse.json();
    console.log('[send-push-notification] FCM response:', JSON.stringify(fcmResult));

    // Check for invalid tokens and clean them up
    if (fcmResult.failure === 1 && fcmResult.results?.[0]?.error === 'InvalidRegistration') {
      console.log(`[send-push-notification] Invalid token detected, clearing for user: ${user_id}`);
      await supabase
        .from('profiles')
        .update({ push_notification_token: null })
        .eq('user_id', user_id);
    }

    const success = fcmResult.success === 1;
    
    return new Response(
      JSON.stringify({ 
        success, 
        fcm_result: fcmResult,
        notification_logged: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[send-push-notification] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});