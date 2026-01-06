import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

// Helper to create HMAC SHA512 signature
async function createHmacSha512(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataToSign = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataToSign);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response('Server configuration error', { status: 500 });
    }

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify webhook signature
    if (signature) {
      const expectedSignature = await createHmacSha512(paystackSecretKey, body);

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return new Response('Invalid signature', { status: 401 });
      }
    }

    const payload = JSON.parse(body);
    console.log('Webhook event received:', payload.event);

    // Only process successful charges
    if (payload.event !== 'charge.success') {
      console.log('Ignoring non-charge.success event:', payload.event);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const data = payload.data;
    const courseId = data.metadata?.course_id;
    const customerEmail = data.customer?.email;
    const reference = data.reference;
    const amount = data.amount;

    console.log('Processing payment:', { reference, customerEmail, courseId, amount });

    if (!courseId) {
      console.error('Missing course_id in metadata');
      return new Response('Missing course_id', { status: 400, headers: corsHeaders });
    }

    if (!customerEmail) {
      console.error('Missing customer email');
      return new Response('Missing customer email', { status: 400, headers: corsHeaders });
    }

    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error('Failed to list users:', userError);
      return new Response('Failed to find user', { status: 500, headers: corsHeaders });
    }

    const user = users.users.find(u => u.email?.toLowerCase() === customerEmail.toLowerCase());
    if (!user) {
      console.error('User not found for email:', customerEmail);
      return new Response('User not found', { status: 404, headers: corsHeaders });
    }

    console.log('Found user:', user.id);

    // Check if purchase already exists
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existingPurchase) {
      console.log('Purchase already exists:', existingPurchase.id);
      return new Response('Purchase already recorded', { status: 200, headers: corsHeaders });
    }

    // Insert the purchase
    const { data: purchase, error: insertError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        course_id: courseId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert purchase:', insertError);
      return new Response('Failed to record purchase', { status: 500, headers: corsHeaders });
    }

    console.log('Purchase recorded via webhook:', purchase.id, 'for reference:', reference);

    return new Response(
      JSON.stringify({ success: true, purchase_id: purchase.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
