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

    const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL");
    if (!N8N_WEBHOOK_URL) {
      throw new Error("N8N_WEBHOOK_URL is not configured");
    }

    // Fire-and-forget: trigger n8n but don't wait for it to finish processing.
    // n8n should have a "Respond to Webhook" node that replies immediately,
    // but we also don't block on the response to avoid edge function timeouts.
    const webhookPayload = {
      course_code,
      course_title,
      department,
      level: level || "100L",
      pdf_urls: allPdfUrls,
      pdf_url: allPdfUrls[0],
      upload_id,
      ambassador_user_id: userId,
    };

    // Use waitUntil pattern: send response immediately, let webhook run in background
    const webhookPromise = fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    }).then(async (res) => {
      if (!res.ok) {
        const errorText = await res.text();
        console.error("n8n webhook error:", res.status, errorText);
        await serviceClient
          .from("course_uploads")
          .update({ status: "failed", error_message: `n8n error: ${res.status}` })
          .eq("id", upload_id);
      }
    }).catch(async (err) => {
      console.error("n8n webhook fetch error:", err);
      await serviceClient
        .from("course_uploads")
        .update({ status: "failed", error_message: `Webhook unreachable: ${err.message}` })
        .eq("id", upload_id);
    });

    // Don't await — let it run in the background
    // EdgeRuntime will keep the function alive for the promise
    webhookPromise;

    return new Response(JSON.stringify({ success: true, upload_id, message: "Processing started" }), {
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
