
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { newUser } = await req.json();
    console.log("Sending admin notification for new user:", newUser);

    // Get all admin users
    const { data: adminProfiles } = await supabase
      .from('admin_users')
      .select('profiles(email)');

    if (!adminProfiles || adminProfiles.length === 0) {
      console.log("No admin users found");
      return new Response(
        JSON.stringify({ message: "No admin users found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email to each admin
    const emailPromises = adminProfiles.map(async (admin) => {
      if (!admin.profiles?.email) return null;

      return resend.emails.send({
        from: "Library Admin <onboarding@resend.dev>",
        to: admin.profiles.email,
        subject: "New User Pending Approval",
        html: `
          <h1>New User Registration</h1>
          <p>A new user has registered and is pending approval:</p>
          <ul>
            <li>Email: ${newUser.email}</li>
            <li>Name: ${newUser.full_name || 'Not provided'}</li>
          </ul>
          <p>Please log in to the admin dashboard to review and approve this user.</p>
        `,
      });
    });

    await Promise.all(emailPromises.filter(Boolean));
    console.log("Admin notification emails sent successfully");

    return new Response(
      JSON.stringify({ message: "Notification sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-admin-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
