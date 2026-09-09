import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CredentialEmailPayload {
  teacherEmail: string;
  teacherName: string;
  schoolName: string;
  orderReference: string;
  tempPassword: string;
  teamAccounts: Array<{
    teamName: string;
    email: string;
    tempPassword: string;
  }>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: CredentialEmailPayload = await req.json();

    if (!payload.teacherEmail || !payload.teacherName || !payload.orderReference) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const emailHtml = buildTeacherCredentialsEmail(payload);
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + resendApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "STEAM Foundry <noreply@steam-foundry.app>",
        to: payload.teacherEmail,
        subject: "Your STEAM Foundry Account - Order " + payload.orderReference,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function buildTeacherCredentialsEmail(payload: CredentialEmailPayload): string {
  const teamsTableRows = payload.teamAccounts
    .map((team) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${team.teamName}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${team.email}</code>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${team.tempPassword}</code>
      </td>
    </tr>`)
    .join("");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #000; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
      .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
      .section { margin-bottom: 24px; }
      .section h2 { color: #1f2937; margin-top: 0; }
      table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 6px; overflow: hidden; }
      th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
      .credential-box { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 12px 0; }
      .credential-label { color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
      .credential-value { color: #000; font-weight: 600; font-family: monospace; word-break: break-all; }
      .cta-button { display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 12px; }
      .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; margin: 12px 0; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">STEAM Foundry</h1>
      </div>
      <div class="content">
        <p>Hello <strong>${payload.teacherName}</strong>,</p>
        <p>Welcome to STEAM Foundry! Your school <strong>${payload.schoolName}</strong> has been registered.</p>
        <div class="section">
          <h2>Your Teacher Account</h2>
          <div class="credential-box">
            <div class="credential-label">Email</div>
            <div class="credential-value">${payload.teacherEmail}</div>
          </div>
          <div class="credential-box">
            <div class="credential-label">Temporary Password</div>
            <div class="credential-value">${payload.tempPassword}</div>
          </div>
          <div class="warning"><strong>⚠️</strong> Change password on first login.</div>
        </div>
        <div class="section">
          <h2>Your Teams (Shared Accounts)</h2>
          <table>
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Email</th>
                <th>Password</th>
              </tr>
            </thead>
            <tbody>
              ${teamsTableRows}
            </tbody>
          </table>
        </div>
        <p>Order Reference: ${payload.orderReference}</p>
      </div>
    </div>
  </body>
</html>`;
}
