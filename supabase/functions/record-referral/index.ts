import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { referral_code, referred_user_id } = await req.json();

    if (!referral_code || !referred_user_id) {
      return new Response(JSON.stringify({ error: "Missing referral_code or referred_user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the referrer by their referral_code in profiles
    const { data: referrerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("referral_code", referral_code)
      .maybeSingle();

    if (profileError || !referrerProfile) {
      console.log("No referrer found for code:", referral_code);
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Don't let someone refer themselves
    if (referrerProfile.id === referred_user_id) {
      return new Response(JSON.stringify({ error: "Cannot refer yourself" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if this user was already referred
    const { data: existing } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_id", referred_user_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ message: "Already referred" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the referral record
    const { error: insertError } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrerProfile.id,
        referred_id: referred_user_id,
        referral_code,
        status: "pending",
      });

    if (insertError) {
      console.error("Failed to insert referral:", insertError);
      return new Response(JSON.stringify({ error: "Failed to record referral" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Referral recorded: ${referrerProfile.id} -> ${referred_user_id} via code ${referral_code}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("record-referral error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
