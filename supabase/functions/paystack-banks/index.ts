import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAYSTACK_BASE = "https://api.paystack.co";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "PAYSTACK_SECRET_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, account_number, bank_code } = await req.json();

    // ─── LIST BANKS ───
    if (action === "list_banks") {
      const res = await fetch(`${PAYSTACK_BASE}/bank?country=nigeria&perPage=100`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Paystack list banks error:", errText);
        return new Response(JSON.stringify({ error: `Paystack API error [${res.status}]` }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await res.json();
      // Return only essential fields to reduce payload
      const banks = (data.data || []).map((b: any) => ({
        name: b.name,
        code: b.code,
        slug: b.slug,
      }));

      return new Response(JSON.stringify({ banks }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── RESOLVE ACCOUNT ───
    if (action === "resolve_account") {
      if (!account_number || !bank_code) {
        return new Response(JSON.stringify({ error: "account_number and bank_code are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(
        `${PAYSTACK_BASE}/bank/resolve?account_number=${encodeURIComponent(account_number)}&bank_code=${encodeURIComponent(bank_code)}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("Paystack resolve error:", errData);
        return new Response(JSON.stringify({ 
          error: errData.message || "Could not verify account",
          verified: false,
        }), {
          status: 200, // Return 200 so client can handle gracefully
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await res.json();
      return new Response(JSON.stringify({
        verified: true,
        account_name: data.data?.account_name || "",
        account_number: data.data?.account_number || account_number,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'list_banks' or 'resolve_account'" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("paystack-banks error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
