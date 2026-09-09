import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegisterInput {
  schoolName: string;
  state: string;
  address: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  teacherName: string;
  teacherEmail: string;
  division: 'primary' | 'secondary' | 'sixth_form';
  teamCount: number;
  fulfilment: 'delivery_lagos' | 'delivery_outside' | 'pickup';
  excludedComponents: string[];
  teams?: Array<{ name: string; students: string[] }>;
}

interface OrderResponse {
  orderReference: string;
  teacherEmail: string;
  teamAccounts?: Array<{ teamName: string; email: string; tempPassword: string }>;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const input: RegisterInput = await req.json();

    if (!input.schoolName || !input.contactEmail || !input.teacherName || !input.teacherEmail || !input.teams || input.teams.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    );

    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name: input.schoolName,
        state: input.state,
        address: input.address,
        contact_name: input.contactName,
        contact_email: input.contactEmail,
        contact_phone: input.contactPhone,
        division: input.division,
      })
      .select()
      .single();

    if (schoolError) {
      console.error('School creation error:', schoolError);
      return new Response(
        JSON.stringify({ error: 'Failed to create school record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const schoolId = schoolData.id;
    const tempTeacherPassword = generateSecurePassword();

    const { data: teacherAuthData, error: teacherAuthError } = await supabase.auth.admin.createUser({
      email: input.teacherEmail,
      password: tempTeacherPassword,
      email_confirm: true,
      user_metadata: { name: input.teacherName, role: 'teacher' },
    });

    if (teacherAuthError) {
      console.error('Teacher auth creation error:', teacherAuthError);
      return new Response(
        JSON.stringify({ error: 'Failed to create teacher account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const teacherId = teacherAuthData.user.id;

    const { error: teacherProfileError } = await supabase.from('profiles').insert({
      id: teacherId,
      role: 'teacher',
      full_name: input.teacherName,
      email: input.teacherEmail,
      school_id: schoolId,
    });

    if (teacherProfileError) {
      console.error('Teacher profile creation error:', teacherProfileError);
      return new Response(
        JSON.stringify({ error: 'Failed to create teacher profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const teamAccounts: Array<{ teamName: string; email: string; tempPassword: string }> = [];

    for (const team of input.teams) {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          school_id: schoolId,
          name: team.name,
          division: input.division,
          teacher_id: teacherId,
        })
        .select()
        .single();

      if (teamError) {
        console.error(`Team creation error for ${team.name}:`, teamError);
        continue;
      }

      const teamId = teamData.id;
      const teamEmail = `${generateTeamEmail(team.name, schoolId)}@steam-foundry.app`;
      const tempTeamPassword = generateSecurePassword();

      const { data: teamAuthData, error: teamAuthError } = await supabase.auth.admin.createUser({
        email: teamEmail,
        password: tempTeamPassword,
        email_confirm: true,
        user_metadata: {
          name: team.name,
          role: 'student',
          is_team_account: true,
          team_members: team.students,
        },
      });

      if (teamAuthError) {
        console.error(`Team auth creation error for ${team.name}:`, teamAuthError);
        continue;
      }

      const teamUserId = teamAuthData.user.id;

      const { error: teamProfileError } = await supabase.from('profiles').insert({
        id: teamUserId,
        role: 'student',
        full_name: team.name,
        email: teamEmail,
        school_id: schoolId,
        team_id: teamId,
        is_team_account: true,
      });

      if (teamProfileError) {
        console.error(`Team profile creation error for ${team.name}:`, teamProfileError);
        continue;
      }

      await supabase.from('team_members').insert(
        team.students.map((student, index) => ({
          team_id: teamId,
          user_id: teamUserId,
          student_name: student,
          order_index: index,
        })),
      );

      teamAccounts.push({
        teamName: team.name,
        email: teamEmail,
        tempPassword: tempTeamPassword,
      });
    }

    const orderReference = generateOrderReference();
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        order_reference: orderReference,
        school_id: schoolId,
        division: input.division,
        team_count: input.teams.length,
        kit_unit_price: 0,
        delivery_fee: 0,
        fulfilment: input.fulfilment,
        line_items: null,
        status: 'registered',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    try {
      const emailPayload = {
        teacherEmail: input.teacherEmail,
        teacherName: input.teacherName,
        schoolName: input.schoolName,
        orderReference: orderReference,
        tempPassword: tempTeacherPassword,
        teamAccounts: teamAccounts,
      };

      await supabase.functions.invoke('send-teacher-credentials', {
        body: emailPayload,
      });
    } catch (emailError) {
      console.error('Error queuing credential email:', emailError);
    }

    const response: OrderResponse = {
      orderReference: orderReference,
      teacherEmail: input.teacherEmail,
      teamAccounts: teamAccounts,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
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

function generateOrderReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = '';
  const randomBytes = crypto.getRandomValues(new Uint8Array(7));
  for (let i = 0; i < 7; i++) {
    ref += chars[randomBytes[i] % chars.length];
  }
  return APEN-+ref;
}

function generateSecurePassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()-_=+';
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));

  password += uppercase[randomBytes[0] % uppercase.length];
  password += lowercase[randomBytes[1] % lowercase.length];
  password += numbers[randomBytes[2] % numbers.length];
  password += symbols[randomBytes[3] % symbols.length];

  for (let i = 4; i < 16; i++) {
    password += allChars[randomBytes[i] % allChars.length];
  }

  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

function generateTeamEmail(teamName: string, schoolId: string): string {
  const slug = teamName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const schoolSuffix = schoolId.slice(0, 6);
  return `${slug}-${schoolSuffix}`;
}
