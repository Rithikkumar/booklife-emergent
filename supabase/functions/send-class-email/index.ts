import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { ConfirmationEmail } from "./_templates/confirmation.tsx";
import { ReminderEmail } from "./_templates/reminder.tsx";
import { UpdateEmail } from "./_templates/update.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "confirmation" | "reminder_24h" | "reminder_1h" | "update";
  classId: string;
  userId?: string; // Optional - if not provided, sends to all participants
}

interface ClassDetails {
  id: string;
  title: string;
  description: string;
  book_title: string;
  book_author: string;
  scheduled_date: string;
  duration_minutes: number;
  platform: string;
  platform_join_url: string;
  user_id: string;
}

interface ParticipantInfo {
  user_id: string;
  email: string;
  display_name: string;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, classId, userId }: EmailRequest = await req.json();

    console.log(`Processing ${type} email for class ${classId}`);

    // Get class details
    const { data: classData, error: classError } = await supabase
      .from("book_classes")
      .select("*")
      .eq("id", classId)
      .single();

    if (classError || !classData) {
      console.error("Class not found:", classError);
      return new Response(
        JSON.stringify({ error: "Class not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get host info
    const { data: hostProfile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("user_id", classData.user_id)
      .single();

    const hostName = hostProfile?.display_name || hostProfile?.username || "Host";

    // Get participants to email
    let participantsQuery = supabase
      .from("class_participants")
      .select("user_id")
      .eq("class_id", classId);

    if (userId) {
      participantsQuery = participantsQuery.eq("user_id", userId);
    }

    const { data: participants, error: participantsError } = await participantsQuery;

    if (participantsError) {
      console.error("Error fetching participants:", participantsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch participants" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!participants || participants.length === 0) {
      console.log("No participants to email");
      return new Response(
        JSON.stringify({ message: "No participants to email" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user emails from auth.users via profiles
    const userIds = participants.map((p) => p.user_id);
    
    // Get profile info for participants
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, username")
      .in("user_id", userIds);

    // Get emails from auth - we need to use admin API
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error fetching user emails:", usersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user emails" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userEmailMap = new Map(
      users
        .filter((u) => userIds.includes(u.id))
        .map((u) => [u.id, u.email])
    );

    const profileMap = new Map(
      profiles?.map((p) => [p.user_id, p.display_name || p.username || "Reader"]) || []
    );

    const emailResults: { success: string[]; failed: string[] } = {
      success: [],
      failed: [],
    };

    // Determine reminder type for templates
    const reminderType = type === "reminder_24h" ? "24h" : type === "reminder_1h" ? "1h" : undefined;

    // Send emails to each participant
    for (const participant of participants) {
      const email = userEmailMap.get(participant.user_id);
      const userName = profileMap.get(participant.user_id) || "Reader";

      if (!email) {
        console.log(`No email found for user ${participant.user_id}`);
        emailResults.failed.push(participant.user_id);
        continue;
      }

      // For update emails, we don't check for duplicates since hosts may update multiple times
      // For other email types, check if email was already sent
      if (type !== "update") {
        const { data: existingNotification } = await supabase
          .from("email_notifications")
          .select("id")
          .eq("class_id", classId)
          .eq("user_id", participant.user_id)
          .eq("email_type", type)
          .single();

        if (existingNotification) {
          console.log(`Email ${type} already sent to user ${participant.user_id}`);
          continue;
        }
      }

      try {
        let html: string;
        let subject: string;

        const commonProps = {
          userName,
          classTitle: classData.title,
          bookTitle: classData.book_title || "TBD",
          bookAuthor: classData.book_author || "TBD",
          hostName,
          scheduledDate: formatDate(classData.scheduled_date),
          duration: classData.duration_minutes || 60,
          platform: classData.platform,
          joinUrl: classData.platform_join_url || `https://dyzogjengmqoqnpfqnda.supabase.co/class/${classId}`,
        };

        if (type === "confirmation") {
          subject = `✅ You're registered for "${classData.title}"`;
          html = await renderAsync(
            React.createElement(ConfirmationEmail, {
              ...commonProps,
              classDescription: classData.description,
            })
          );
        } else if (type === "update") {
          subject = `📝 "${classData.title}" has been updated`;
          html = await renderAsync(
            React.createElement(UpdateEmail, {
              ...commonProps,
              classDescription: classData.description,
            })
          );
        } else {
          const isOneHour = type === "reminder_1h";
          subject = isOneHour
            ? `⏰ "${classData.title}" starts in 1 hour!`
            : `📅 "${classData.title}" is tomorrow!`;
          html = await renderAsync(
            React.createElement(ReminderEmail, {
              ...commonProps,
              reminderType: reminderType!,
            })
          );
        }

        const { error: sendError } = await resend.emails.send({
          from: "BookCrossing <onboarding@resend.dev>",
          to: [email],
          subject,
          html,
        });

        if (sendError) {
          console.error(`Failed to send email to ${email}:`, sendError);
          emailResults.failed.push(participant.user_id);
          
          // Log failed attempt
          await supabase.from("email_notifications").insert({
            class_id: classId,
            user_id: participant.user_id,
            email_type: type,
            status: "failed",
            error_message: sendError.message,
          });
        } else {
          console.log(`Email sent successfully to ${email}`);
          emailResults.success.push(participant.user_id);
          
          // Log successful send
          await supabase.from("email_notifications").insert({
            class_id: classId,
            user_id: participant.user_id,
            email_type: type,
            status: "sent",
            sent_at: new Date().toISOString(),
          });
        }
      } catch (emailError) {
        console.error(`Error sending email to ${email}:`, emailError);
        emailResults.failed.push(participant.user_id);
      }
    }

    console.log(`Email batch complete. Success: ${emailResults.success.length}, Failed: ${emailResults.failed.length}`);

    return new Response(
      JSON.stringify({
        message: "Email batch processed",
        results: emailResults,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-class-email function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
