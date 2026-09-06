import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: CredentialEmailPayload = await req.json();

    if (!payload.teacherEmail || !payload.teacherName || !payload.orderReference) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Build email HTML
    const emailHtml = buildTeacherCredentialsEmail(payload);

    // Send via Resend (update with your actual Resend API key)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': Bearer +resendApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'STEAM Foundry <noreply@steam-foundry.app>',
        to: payload.teacherEmail,
        subject: Your STEAM Foundry Account - Order +payload.orderReference,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

function buildTeacherCredentialsEmail(payload: CredentialEmailPayload): string {
  const teamsTable = payload.teamAccounts
    .map(
      (team) => 
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>+team.teamName+</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">+team.email+</code>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">+team.tempPassword+</code>
      </td>
    </tr>
  ,
    )
    .join('');

  return 
    <!DOCTYPE html>
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
          .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">STEAM Foundry</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Innovation Lab for African Schools</p>
          </div>

          <div class="content">
            <p>Hello <strong>+payload.teacherName+</strong>,</p>

            <p>Welcome to STEAM Foundry! Your school (<strong>+payload.schoolName+</strong>) has been registered for the 2026 Innovation Program.</p>

            <div class="section">
              <h2>Your Teacher Account</h2>
              <p>Use these credentials to sign in to the Teacher Dashboard:</p>
              
              <div class="credential-box">
                <div class="credential-label">Email</div>
                <div class="credential-value">+payload.teacherEmail+</div>
              </div>

              <div class="credential-box">
                <div class="credential-label">Temporary Password</div>
                <div class="credential-value">+payload.tempPassword+</div>
              </div>

              <div class="warning">
                <strong>⚠️ Important:</strong> This is a temporary password. You will be asked to set a new password on first login.
              </div>

              <a href="https://steam-foundry.app/lab" class="cta-button">Sign In to Dashboard</a>
            </div>

            <div class="section">
              <h2>Your Teams' Shared Accounts</h2>
              <p>Each team has a single shared account that all team members will use. Share these credentials with your students:</p>

              <table>
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Email</th>
                    <th>Password</th>
                  </tr>
                </thead>
                <tbody>
                  +teamsTable+
                </tbody>
              </table>

              <div class="warning" style="margin-top: 16px;">
                <strong>How to share:</strong> You can share these credentials via email, printed handout, or verbally. All students on a team use the same login to access the shared Team Dashboard.
              </div>
            </div>

            <div class="section">
              <h2>What's Next?</h2>
              <ol>
                <li><strong>Sign in</strong> to your teacher account at <a href="https://steam-foundry.app/lab">steam-foundry.app/lab</a></li>
                <li><strong>Set a new password</strong> when prompted</li>
                <li><strong>Share team credentials</strong> with your students</li>
                <li><strong>Students login</strong> with their team's email and password</li>
                <li><strong>Start the journey</strong> through Design → Build → Intelligize → Battle</li>
              </ol>
            </div>

            <div class="section">
              <h3>Order Reference</h3>
              <p>For any queries or support, reference your order: <code>+payload.orderReference+</code></p>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              If you have any questions, contact us at <strong>support@steam-foundry.app</strong> or message us on WhatsApp: <strong>+234 803 883 8094</strong>
            </p>

            <div class="footer">
              <p>STEAM Foundry © 2026 • Innovation Lab for African Secondary Schools</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  ;
}
