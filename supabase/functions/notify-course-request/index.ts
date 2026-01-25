import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CourseRequestPayload {
  courseCode: string;
  courseName: string;
  department: string;
  courseRepName: string;
  courseRepPhone: string;
  extraNotes?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!adminEmail) {
      console.error("ADMIN_NOTIFICATION_EMAIL not configured");
      return new Response(
        JSON.stringify({ error: "Admin email not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the user from the JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the user's JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: CourseRequestPayload = await req.json();
    console.log("Course request received:", payload);

    // Insert the request into the database
    const { data: insertedRequest, error: insertError } = await supabase
      .from("course_requests")
      .insert({
        user_id: user.id,
        course_code: payload.courseCode,
        course_name: payload.courseName,
        department: payload.department,
        course_rep_name: payload.courseRepName,
        course_rep_phone: payload.courseRepPhone,
        extra_notes: payload.extraNotes || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Request saved:", insertedRequest.id);

    // Send email notification
    const resend = new Resend(resendApiKey);
    
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e3a5f; font-size: 24px; margin-bottom: 20px;">📘 New Course Request</h1>
        
        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #64748b; width: 140px;">Course Code:</td>
              <td style="padding: 8px 0; color: #1e293b;">${payload.courseCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Course Name:</td>
              <td style="padding: 8px 0; color: #1e293b;">${payload.courseName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Department:</td>
              <td style="padding: 8px 0; color: #1e293b;">${payload.department}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Course Rep:</td>
              <td style="padding: 8px 0; color: #1e293b;">${payload.courseRepName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Rep Phone:</td>
              <td style="padding: 8px 0; color: #1e293b;">${payload.courseRepPhone}</td>
            </tr>
            ${payload.extraNotes ? `
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Extra Notes:</td>
              <td style="padding: 8px 0; color: #1e293b;">${payload.extraNotes}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="background: #e0f2fe; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0; color: #0369a1; font-size: 14px;">
            <strong>Requested by:</strong> ${user.email}
          </p>
        </div>
        
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          This request was submitted via LCU Prep at ${new Date().toLocaleString()}.
        </p>
      </div>
    `;

    const { error: emailError } = await resend.emails.send({
      from: "LCU Prep <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `📘 Course Request: ${payload.courseCode} - ${payload.courseName}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      // Don't fail the request if email fails - the data is saved
      return new Response(
        JSON.stringify({ 
          success: true, 
          requestId: insertedRequest.id,
          emailSent: false,
          warning: "Request saved but email notification failed" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully to:", adminEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        requestId: insertedRequest.id,
        emailSent: true 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in notify-course-request:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
