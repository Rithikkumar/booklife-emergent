import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform, classData, accessToken } = await req.json();

    console.log(`Creating meeting for platform: ${platform}`);

    let meetingData = {};

    switch (platform) {
      case 'zoom':
        meetingData = await createZoomMeeting(classData, accessToken);
        break;
      case 'webex':
        meetingData = await createWebexMeeting(classData, accessToken);
        break;
      case 'google_meet':
        meetingData = await createGoogleMeetMeeting(classData, accessToken);
        break;
      case 'youtube_live':
        meetingData = await createYouTubeLiveStream(classData, accessToken);
        break;
      default:
        throw new Error('Unsupported platform');
    }

    return new Response(JSON.stringify({ meetingData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Meeting creation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to get decrypted credentials securely
async function getDecryptedCredentials(classId: string, authHeader: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Set auth for the request
  const token = authHeader.replace('Bearer ', '');
  await supabase.auth.setSession({ access_token: token, refresh_token: '' });

  const { data, error } = await supabase.rpc('get_decrypted_credentials', {
    p_class_id: classId
  });

  if (error) {
    throw error;
  }

  return data[0] || null;
}

async function createZoomMeeting(classData: any, accessToken: string) {
  const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: classData.title,
      type: 2, // Scheduled meeting
      start_time: classData.scheduled_date,
      duration: classData.duration_minutes,
      agenda: classData.description,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        watermark: false,
        use_pmi: false,
        approval_type: 0,
        audio: 'both',
        auto_recording: 'none'
      }
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create Zoom meeting');
  }

  const meeting = await response.json();
  return {
    meeting_id: meeting.id.toString(),
    meeting_url: meeting.start_url,
    join_url: meeting.join_url,
    password: meeting.password
  };
}

async function createWebexMeeting(classData: any, accessToken: string) {
  const response = await fetch('https://webexapis.com/v1/meetings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: classData.title,
      agenda: classData.description,
      start: classData.scheduled_date,
      end: new Date(new Date(classData.scheduled_date).getTime() + classData.duration_minutes * 60000).toISOString(),
      enabledAutoRecordMeeting: false,
      allowAnyUserToBeCoHost: false
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create WebEx meeting');
  }

  const meeting = await response.json();
  return {
    meeting_id: meeting.id,
    meeting_url: meeting.hostUrl,
    join_url: meeting.webLink,
    password: meeting.password
  };
}

async function createGoogleMeetMeeting(classData: any, accessToken: string) {
  // Create Google Calendar event with Meet
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: classData.title,
      description: classData.description,
      start: {
        dateTime: classData.scheduled_date,
        timeZone: 'UTC'
      },
      end: {
        dateTime: new Date(new Date(classData.scheduled_date).getTime() + classData.duration_minutes * 60000).toISOString(),
        timeZone: 'UTC'
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create Google Meet');
  }

  const event = await response.json();
  const meetLink = event.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;
  
  return {
    meeting_id: event.id,
    meeting_url: meetLink,
    join_url: meetLink,
    password: null
  };
}

async function createYouTubeLiveStream(classData: any, accessToken: string) {
  // Create YouTube Live Stream
  const streamResponse = await fetch('https://www.googleapis.com/youtube/v3/liveStreams?part=snippet,cdn', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      snippet: {
        title: `${classData.title} - Live Stream`
      },
      cdn: {
        frameRate: '30fps',
        ingestionType: 'rtmp',
        resolution: '720p'
      }
    })
  });

  if (!streamResponse.ok) {
    throw new Error('Failed to create YouTube Live Stream');
  }

  const stream = await streamResponse.json();

  // Create YouTube Live Broadcast
  const broadcastResponse = await fetch('https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      snippet: {
        title: classData.title,
        description: classData.description,
        scheduledStartTime: classData.scheduled_date
      },
      status: {
        privacyStatus: 'public'
      }
    })
  });

  if (!broadcastResponse.ok) {
    throw new Error('Failed to create YouTube Broadcast');
  }

  const broadcast = await broadcastResponse.json();

  return {
    meeting_id: broadcast.id,
    meeting_url: `https://studio.youtube.com/video/${broadcast.id}/livestreaming`,
    join_url: `https://www.youtube.com/watch?v=${broadcast.id}`,
    stream_key: stream.cdn.ingestionInfo.streamName
  };
}