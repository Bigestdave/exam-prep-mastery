import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload.sub;
      if (!userId) throw new Error("No sub in token");
    } catch {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { course_code, course_title, department, level, pdf_urls, pdf_url, upload_id } = await req.json();

    // Support both pdf_urls (array) and legacy pdf_url (string)
    const allPdfUrls: string[] = pdf_urls || (pdf_url ? [pdf_url] : []);

    if (!course_code || !course_title || !department || allPdfUrls.length === 0 || !upload_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceClient
      .from("course_uploads")
      .update({ status: "processing" })
      .eq("id", upload_id);

    // Trigger n8n webhook with pdf_urls array
    const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL");
    if (!N8N_WEBHOOK_URL) {
      throw new Error("N8N_WEBHOOK_URL is not configured");
    }

    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_code,
        course_title,
        department,
        level: level || "100L",
        pdf_urls: allPdfUrls,
        pdf_url: allPdfUrls[0], // backward compat for n8n if needed
        upload_id,
        ambassador_user_id: userId,
      }),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("n8n webhook error:", webhookResponse.status, errorText);

      await serviceClient
        .from("course_uploads")
        .update({ status: "failed", error_message: `n8n error: ${webhookResponse.status}` })
        .eq("id", upload_id);

      return new Response(JSON.stringify({ error: "Processing pipeline failed to start" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // After n8n succeeds, trigger quiz generation in background
    const { data: courseData } = await serviceClient
      .from("courses")
      .select("id")
      .eq("code", course_code)
      .eq("faculty", department)
      .maybeSingle();

    if (courseData?.id) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        
        fetch(`${supabaseUrl}/functions/v1/generate-quiz-options`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            source_course_id: courseData.id,
            course_code,
            limit: 50,
          }),
        }).then(res => {
          console.log(`Quiz generation triggered for ${course_code}: ${res.status}`);
        }).catch(err => {
          console.error(`Quiz generation trigger failed for ${course_code}:`, err);
        });
      }
    }

    return new Response(JSON.stringify({ success: true, message: "Processing started" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("trigger-processing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
