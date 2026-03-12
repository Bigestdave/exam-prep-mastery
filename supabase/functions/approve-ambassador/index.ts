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

    // Send approval notification email
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const recipientEmail = targetUser.email;
    if (resendKey && recipientEmail) {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "LCU Prep <noreply@lcuprep.com>",
            to: [recipientEmail],
            subject: "🎉 You're now an LCU Prep Ambassador!",
            html: `
              <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#ffffff;">
                <h1 style="color:#1a1a1a;font-size:22px;margin-bottom:16px;">Welcome aboard, Ambassador! 🎓</h1>
                <p style="color:#444;font-size:15px;line-height:1.6;">
                  Great news — your ambassador application has been <strong>approved</strong>!
                </p>
                <p style="color:#444;font-size:15px;line-height:1.6;">
                  You can now log in to your <strong>Ambassador Dashboard</strong> where you'll find your unique referral link. Share it with students in your department to help them prepare — and earn rewards for every unlock.
                </p>
                <div style="text-align:center;margin:28px 0;">
                  <a href="https://lcuprep.lovable.app/ambassador" 
                     style="background:#1a1a1a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
                    Open Your Dashboard
                  </a>
                </div>
                <p style="color:#888;font-size:13px;margin-top:24px;">
                  Thank you for helping your department excel.<br/>— The LCU Prep Team
                </p>
              </div>
            `,
          }),
        });
        if (!emailRes.ok) {
          console.error("Email send failed:", await emailRes.text());
        }
      } catch (emailErr) {
        console.error("Email error:", emailErr);
      }
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
