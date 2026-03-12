import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getUserIdFromToken(authHeader: string): string | null {
  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller via manual JWT decoding
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const callerId = getUserIdFromToken(authHeader);
    if (!callerId) throw new Error("Invalid token");

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .single();

    if (!roleData) throw new Error("Not authorized — admin only");

    const { email, application_id } = await req.json();
    if (!email) throw new Error("Email required");

    // Find user by email using admin API
    const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers();
    if (listErr) throw listErr;

    const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!targetUser) {
      throw new Error(`No user found with email: ${email}. They must sign up first.`);
    }

    // Add ambassador role (ignore if already exists)
    const { error: roleErr } = await adminClient
      .from("user_roles")
      .insert({ user_id: targetUser.id, role: "ambassador" });

    if (roleErr && roleErr.code !== "23505") throw roleErr;

    // Update application status
    if (application_id) {
      await adminClient
        .from("ambassador_applications")
        .update({ status: "approved", reviewed_at: new Date().toISOString(), user_id: targetUser.id })
        .eq("id", application_id);
    }

    return new Response(
      JSON.stringify({ success: true, user_id: targetUser.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("approve-ambassador error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
