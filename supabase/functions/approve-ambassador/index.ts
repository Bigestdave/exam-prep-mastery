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

async function findUserByEmail(adminClient: ReturnType<typeof createClient>, email: string) {
  const normalizedEmail = email.toLowerCase();
  let page = 1;
  const perPage = 200;

  while (page <= 25) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
    if (match) return match;

    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Not authenticated");

    const callerId = getUserIdFromToken(authHeader);
    if (!callerId) throw new Error("Invalid token");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: roleData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) throw new Error("Not authorized — admin only");

    const { email, application_id, user_id } = await req.json();
    if (!email && !user_id) throw new Error("Email or user_id required");

    let targetUser: { id: string; email?: string | null } | null = null;

    if (user_id) {
      const { data: userById, error: userByIdError } = await adminClient.auth.admin.getUserById(user_id);
      if (!userByIdError && userById?.user) {
        targetUser = userById.user;
      }
    }

    if (!targetUser && email) {
      targetUser = await findUserByEmail(adminClient, email);
    }

    if (!targetUser) {
      throw new Error(`No user found for application (${email ?? user_id}). They must sign up first.`);
    }

    const { error: roleInsertError } = await adminClient
      .from("user_roles")
      .insert({ user_id: targetUser.id, role: "ambassador" });

    if (roleInsertError && roleInsertError.code !== "23505") throw roleInsertError;

    if (application_id) {
      const { error: applicationError } = await adminClient
        .from("ambassador_applications")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          user_id: targetUser.id,
        })
        .eq("id", application_id);

      if (applicationError) throw applicationError;
    }

    return new Response(
      JSON.stringify({ success: true, user_id: targetUser.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("approve-ambassador error:", message);

    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
