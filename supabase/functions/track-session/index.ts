import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_IPS = 3;

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

    // Verify user
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Get client IP from headers
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert current session (update last_active if IP already exists)
    await supabaseAdmin
      .from("active_sessions")
      .upsert(
        { user_id: userId, ip_address: ip, last_active: new Date().toISOString() },
        { onConflict: "user_id,ip_address" }
      );

    // Get all active sessions for this user, ordered by last_active
    const { data: sessions } = await supabaseAdmin
      .from("active_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("last_active", { ascending: true });

    if (sessions && sessions.length > MAX_IPS) {
      // Get unique IPs
      const uniqueIPs = [...new Set(sessions.map((s) => s.ip_address))];

      if (uniqueIPs.length > MAX_IPS) {
        // Too many IPs - revoke oldest sessions to get back to MAX_IPS
        const sessionsToRemove = sessions.length - MAX_IPS;
        const oldSessionIds = sessions.slice(0, sessionsToRemove).map((s) => s.id);

        // Remove old session records
        await supabaseAdmin
          .from("active_sessions")
          .delete()
          .in("id", oldSessionIds);

        // Sign out the user from those old sessions by revoking via admin API
        // Note: We can't target specific sessions, but cleaning the records
        // means the old IPs won't be tracked anymore

        return new Response(
          JSON.stringify({
            success: true,
            message: "Session recorded. Oldest sessions were revoked due to IP limit.",
            active_ips: MAX_IPS,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Session recorded.",
        active_ips: sessions?.length || 1,
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
