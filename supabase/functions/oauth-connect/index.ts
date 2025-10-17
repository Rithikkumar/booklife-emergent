import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform, scopes, redirectUrl } = await req.json();

    console.log(`Initiating OAuth for platform: ${platform}`);

    let authUrl = '';
    let clientId = '';

    switch (platform) {
      case 'zoom':
        clientId = Deno.env.get('ZOOM_CLIENT_ID') || '';
        authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=${scopes.join('%20')}`;
        break;

      case 'webex':
        clientId = Deno.env.get('WEBEX_CLIENT_ID') || '';
        authUrl = `https://webexapis.com/v1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=${scopes.join('%20')}`;
        break;

      case 'google_meet':
        clientId = Deno.env.get('GOOGLE_CLIENT_ID') || '';
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline`;
        break;

      case 'youtube_live':
        clientId = Deno.env.get('GOOGLE_CLIENT_ID') || '';
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline`;
        break;

      default:
        throw new Error('Unsupported platform');
    }

    if (!clientId) {
      throw new Error(`Missing client ID for ${platform}`);
    }

    return new Response(JSON.stringify({ authUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('OAuth initiation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});