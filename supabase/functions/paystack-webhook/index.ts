import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

async function createHmacSha512(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataToSign = encoder.encode(data);
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataToSign);
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response('Server configuration error', { status: 500 });
    }

    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (signature) {
      const expectedSignature = await createHmacSha512(paystackSecretKey, body);
      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return new Response('Invalid signature', { status: 401 });
      }
    }

    const payload = JSON.parse(body);
    console.log('Webhook event received:', payload.event);

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by email
    let user = null;
    let page = 1;
    const perPage = 100;
    while (!user) {
      const { data: usersPage, error: userError } = await supabase.auth.admin.listUsers({ page, perPage });
      if (userError) {
        console.error('Failed to list users:', userError);
        return new Response('Failed to find user', { status: 500, headers: corsHeaders });
      }
      if (!usersPage.users || usersPage.users.length === 0) break;
      user = usersPage.users.find(u => u.email?.toLowerCase() === customerEmail.toLowerCase());
      if (usersPage.users.length < perPage) break;
      page++;
    }

    if (!user) {
      console.error('User not found for email:', customerEmail);
      return new Response('User not found', { status: 404, headers: corsHeaders });
    }

    console.log('Found user:', user.id);

    const courseIdsToRecord: string[] = paymentType === 'bundle' && Array.isArray(bundleCourseIds) && bundleCourseIds.length > 0
      ? bundleCourseIds
      : [courseId];

    console.log('Recording purchases for courses:', courseIdsToRecord);

    let recordedCount = 0;
    const departmentsAffected = new Set<string>();

    for (const cId of courseIdsToRecord) {
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

      const { data: purchase, error: insertError } = await supabase
        .from('purchases')
        .insert({ user_id: user.id, course_id: cId })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to insert purchase for course:', cId, insertError);
      } else {
        console.log('Purchase recorded:', purchase.id, 'for course:', cId);
        recordedCount++;

        // Track which department this course belongs to for milestone check
        const { data: course } = await supabase
          .from('courses')
          .select('faculty')
          .eq('id', cId)
          .maybeSingle();
        if (course?.faculty) {
          departmentsAffected.add(course.faculty);
        }
      }
    }

    // ─── REFERRAL: Mark as converted (NO per-sale commission anymore) ───
    if (recordedCount > 0) {
      try {
        const { data: referral } = await supabase
          .from('referrals')
          .select('id, referrer_id, status')
          .eq('referred_id', user.id)
          .eq('status', 'pending')
          .maybeSingle();

        if (referral) {
          // Just mark as converted, no wallet credit
          await supabase
            .from('referrals')
            .update({
              status: 'converted',
              credited_amount: 0,
              converted_at: new Date().toISOString(),
            })
            .eq('id', referral.id);

          console.log(`Referral for user ${user.id} marked as converted (no per-sale commission)`);
        }
      } catch (refErr) {
        console.error('Referral update error:', refErr);
      }

      // ─── CHECK DEPARTMENT MILESTONES ───
      for (const dept of departmentsAffected) {
        try {
          const fnUrl = `${supabaseUrl}/functions/v1/check-milestones`;
          await fetch(fnUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ department: dept }),
          });
          console.log(`Milestone check triggered for department: ${dept}`);
        } catch (msErr) {
          console.error('Milestone check error for', dept, msErr);
        }
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
