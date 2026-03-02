import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_DEVICES = 2;

Deno.serve(async (req) => {
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

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Decode JWT payload directly to avoid getUser/getClaims session issues in edge runtime
    const token = authHeader.replace("Bearer ", "");
    let userId: string;
    try {
      const payloadB64 = token.split(".")[1];
      const payload = JSON.parse(atob(payloadB64));
      userId = payload.sub;
      if (!userId) throw new Error("No sub claim");
    } catch (e) {
      console.error("JWT decode failed:", e);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get device_id from request body
    const body = await req.json().catch(() => ({}));
    const deviceId = body.device_id;
    const action = body.action || "track"; // "track" or "check"

    if (!deviceId) {
      return new Response(JSON.stringify({ error: "device_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "check") {
      // Check if this device is still in active sessions
      const { data: session } = await supabaseAdmin
        .from("active_sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("device_id", deviceId)
        .maybeSingle();

      return new Response(
        JSON.stringify({ valid: !!session }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert current device session
    await supabaseAdmin
      .from("active_sessions")
      .upsert(
        {
          user_id: userId,
          device_id: deviceId,
          ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
          last_active: new Date().toISOString(),
        },
        { onConflict: "user_id,device_id" }
      );

    // Get all sessions for this user
    const { data: sessions } = await supabaseAdmin
      .from("active_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("last_active", { ascending: true });

    if (sessions && sessions.length > MAX_DEVICES) {
      // Remove oldest sessions to stay within limit
      const toRemove = sessions.length - MAX_DEVICES;
      const oldIds = sessions.slice(0, toRemove).map((s) => s.id);

      await supabaseAdmin
        .from("active_sessions")
        .delete()
        .in("id", oldIds);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Session recorded. Oldest device sessions were removed.",
          removed_count: toRemove,
          active_devices: MAX_DEVICES,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Session recorded.",
        active_devices: sessions?.length || 1,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("track-session error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
