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
    const paymentType = data.metadata?.payment_type || 'single';
    const bundleCourseIds = data.metadata?.bundle_course_ids;
    const customerEmail = data.customer?.email;
    const reference = data.reference;
    const amount = data.amount;

    console.log('Processing payment:', { reference, customerEmail, courseId, paymentType, amount });

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

    // Find user by email using paginated search
    let user = null;
    let page = 1;
    const perPage = 100;
    
    while (!user) {
      const { data: usersPage, error: userError } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });
      
      if (userError) {
        console.error('Failed to list users:', userError);
        return new Response('Failed to find user', { status: 500, headers: corsHeaders });
      }
      
      if (!usersPage.users || usersPage.users.length === 0) {
        break;
      }
      
      user = usersPage.users.find(u => u.email?.toLowerCase() === customerEmail.toLowerCase());
      
      if (usersPage.users.length < perPage) {
        break;
      }
      
      page++;
    }
    
    if (!user) {
      console.error('User not found for email:', customerEmail);
      return new Response('User not found', { status: 404, headers: corsHeaders });
    }

    console.log('Found user:', user.id);

    // Determine which course IDs to record
    const courseIdsToRecord: string[] = paymentType === 'bundle' && Array.isArray(bundleCourseIds) && bundleCourseIds.length > 0
      ? bundleCourseIds
      : [courseId];

    console.log('Recording purchases for courses:', courseIdsToRecord);

    let recordedCount = 0;

    for (const cId of courseIdsToRecord) {
      // Check if purchase already exists
      const { data: existingPurchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', cId)
        .maybeSingle();

      if (existingPurchase) {
        console.log('Purchase already exists for course:', cId);
        continue;
      }

      // Insert the purchase
      const { data: purchase, error: insertError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          course_id: cId,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to insert purchase for course:', cId, insertError);
      } else {
        console.log('Purchase recorded:', purchase.id, 'for course:', cId);
        recordedCount++;
      }
    }

    // ─── REFERRAL CREDIT ───
    // Check if this buyer was referred by an ambassador
    if (recordedCount > 0) {
      try {
        const { data: referral } = await supabase
          .from('referrals')
          .select('id, referrer_id, status')
          .eq('referred_id', user.id)
          .eq('status', 'pending')
          .maybeSingle();

        if (referral) {
          // Credit the ambassador ₦500
          const { error: walletError } = await supabase.rpc('credit_ambassador_wallet', {
            ambassador_id: referral.referrer_id,
            credit_amount: 500,
          });

          if (!walletError) {
            // Mark referral as converted
            await supabase
              .from('referrals')
              .update({
                status: 'credited',
                credited_amount: 500,
                converted_at: new Date().toISOString(),
              })
              .eq('id', referral.id);

            console.log(`Ambassador ${referral.referrer_id} credited ₦500 for referral of user ${user.id}`);
          } else {
            console.error('Failed to credit ambassador wallet:', walletError);
          }
        }
      } catch (refErr) {
        console.error('Referral credit error:', refErr);
      }
    }

    console.log(`Webhook complete: ${recordedCount} new purchases recorded for reference:`, reference);

    return new Response(
      JSON.stringify({ success: true, recorded: recordedCount }),
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
