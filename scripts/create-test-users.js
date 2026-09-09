#!/usr/bin/env node

/**
 * Create test user accounts in Supabase
 * Usage: node scripts/create-test-users.js <SERVICE_ROLE_KEY>
 */

const https = require('https');

const SUPABASE_URL = 'https://sctsrxuquhzdjjnlsqbm.supabase.co';
const SUPABASE_PROJECT = 'sctsrxuquhzdjjnlsqbm';

const testUsers = [
  {
    email: 'jaydigitalstrategist@gmail.com',
    password: '@Welcome2026&teacher',
    role: 'teacher',
    fullName: 'Test Teacher',
  },
  {
    email: 'digitalcreativeshubltd@gmail.com',
    password: '@Welcome2026&judge',
    role: 'judge',
    fullName: 'Test Judge',
  },
];

async function makeRequest(method, path, body, serviceRoleKey) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${path}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createUser(user, serviceRoleKey) {
  console.log(`\n📧 Creating ${user.role} account: ${user.email}`);

  // Create auth user
  const authRes = await makeRequest(
    'POST',
    '/auth/v1/admin/users',
    {
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { role: user.role },
    },
    serviceRoleKey
  );

  if (authRes.status !== 201) {
    console.error(`❌ Auth creation failed:`, authRes.data);
    return false;
  }

  const userId = authRes.data.id;
  console.log(`✅ Auth user created: ${userId}`);

  // Create profile
  const profileRes = await makeRequest(
    'POST',
    '/rest/v1/profiles',
    {
      id: userId,
      role: user.role,
      full_name: user.fullName,
      email: user.email,
      school_id: user.role === 'teacher' ? null : null,
    },
    serviceRoleKey
  );

  if (profileRes.status !== 201) {
    console.error(`❌ Profile creation failed:`, profileRes.data);
    return false;
  }

  console.log(`✅ Profile created`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Password: ${user.password}`);
  console.log(`   Role: ${user.role}`);

  return true;
}

async function main() {
  const serviceRoleKey = process.argv[2];

  if (!serviceRoleKey) {
    console.error('\n❌ Error: SERVICE_ROLE_KEY is required');
    console.log('\nUsage: node scripts/create-test-users.js <SERVICE_ROLE_KEY>');
    console.log('\nFind your SERVICE_ROLE_KEY in:');
    console.log('1. Supabase Dashboard → Settings → API');
    console.log('2. Or in your .env.local file\n');
    process.exit(1);
  }

  console.log('🚀 Creating test user accounts...\n');

  for (const user of testUsers) {
    await createUser(user, serviceRoleKey);
  }

  console.log('\n✅ All test accounts created!\n');
  console.log('📋 Test Credentials Summary:');
  console.log('═'.repeat(60));
  testUsers.forEach(u => {
    console.log(`\n${u.role.toUpperCase()}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Password: ${u.password}`);
  });
  console.log('\n' + '═'.repeat(60));
}

main().catch(console.error);
