import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    
    // Find classes starting in approximately 24 hours (23-25 hour window)
    const twentyThreeHours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const twentyFiveHours = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    
    // Find classes starting in approximately 1 hour (45-75 minute window)
    const fortyFiveMinutes = new Date(now.getTime() + 45 * 60 * 1000);
    const seventyFiveMinutes = new Date(now.getTime() + 75 * 60 * 1000);

    console.log("Checking for classes needing reminders...");

    // Get classes needing 24h reminder
    const { data: classes24h, error: error24h } = await supabase
      .from("book_classes")
      .select("id")
      .gte("scheduled_date", twentyThreeHours.toISOString())
      .lte("scheduled_date", twentyFiveHours.toISOString())
      .in("status", ["scheduled", "live"]);

    if (error24h) {
      console.error("Error fetching 24h classes:", error24h);
    }

    // Get classes needing 1h reminder
    const { data: classes1h, error: error1h } = await supabase
      .from("book_classes")
      .select("id")
      .gte("scheduled_date", fortyFiveMinutes.toISOString())
      .lte("scheduled_date", seventyFiveMinutes.toISOString())
      .in("status", ["scheduled", "live"]);

    if (error1h) {
      console.error("Error fetching 1h classes:", error1h);
    }

    const results = {
      reminders_24h: [] as string[],
      reminders_1h: [] as string[],
      errors: [] as string[],
    };

    // Send 24h reminders
    if (classes24h && classes24h.length > 0) {
      console.log(`Found ${classes24h.length} classes needing 24h reminder`);
      
      for (const classItem of classes24h) {
        try {
          const response = await fetch(
            `${supabaseUrl}/functions/v1/send-class-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                type: "reminder_24h",
                classId: classItem.id,
              }),
            }
          );

          if (response.ok) {
            results.reminders_24h.push(classItem.id);
          } else {
            const errorText = await response.text();
            console.error(`Failed to send 24h reminder for class ${classItem.id}:`, errorText);
            results.errors.push(`24h-${classItem.id}`);
          }
        } catch (err) {
          console.error(`Error sending 24h reminder for class ${classItem.id}:`, err);
          results.errors.push(`24h-${classItem.id}`);
        }
      }
    }

    // Send 1h reminders
    if (classes1h && classes1h.length > 0) {
      console.log(`Found ${classes1h.length} classes needing 1h reminder`);
      
      for (const classItem of classes1h) {
        try {
          const response = await fetch(
            `${supabaseUrl}/functions/v1/send-class-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                type: "reminder_1h",
                classId: classItem.id,
              }),
            }
          );

          if (response.ok) {
            results.reminders_1h.push(classItem.id);
          } else {
            const errorText = await response.text();
            console.error(`Failed to send 1h reminder for class ${classItem.id}:`, errorText);
            results.errors.push(`1h-${classItem.id}`);
          }
        } catch (err) {
          console.error(`Error sending 1h reminder for class ${classItem.id}:`, err);
          results.errors.push(`1h-${classItem.id}`);
        }
      }
    }

    console.log("Reminder processing complete:", results);

    return new Response(
      JSON.stringify({
        message: "Reminder processing complete",
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in process-class-reminders:", error);
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
