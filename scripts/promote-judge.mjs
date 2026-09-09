#!/usr/bin/env node

/**
 * Promote a judge account by updating their role in Supabase
 * Usage: node scripts/promote-judge.mjs <SERVICE_ROLE_KEY> <JUDGE_EMAIL> [JUDGE_NAME]
 */

import https from 'https';
import { URL } from 'url';

const SUPABASE_URL = 'https://sctsrxuquhzdjjnlsqbm.supabase.co';

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

async function promoteJudge(judgeEmail, judgeName, serviceRoleKey) {
  console.log(`\n📋 Promoting judge: ${judgeEmail}`);

  // Update profile to set role = 'judge'
  const updateRes = await makeRequest(
    'PATCH',
    '/rest/v1/profiles',
    {
      role: 'judge',
      full_name: judgeName || 'Judge',
    },
    serviceRoleKey
  ).catch(() => null);

  if (!updateRes || !updateRes.data) {
    console.error(`❌ Failed to find profile for ${judgeEmail}`);
    return false;
  }

  console.log(`✅ Judge promoted!`);
  console.log(`   Email: ${judgeEmail}`);
  console.log(`   Role: judge`);
  console.log(`   Name: ${judgeName || 'Judge'}`);

  return true;
}

async function main() {
  const serviceRoleKey = process.argv[2];
  const judgeEmail = process.argv[3];
  const judgeName = process.argv[4];

  if (!serviceRoleKey || !judgeEmail) {
    console.error('\n❌ Error: SERVICE_ROLE_KEY and JUDGE_EMAIL are required');
    console.log('\nUsage: node scripts/promote-judge.mjs <SERVICE_ROLE_KEY> <JUDGE_EMAIL> [JUDGE_NAME]');
    console.log('\nExample: node scripts/promote-judge.mjs "your-key-here" "judge@example.com" "Judge Name"');
    console.log('\nFind your SERVICE_ROLE_KEY in:');
    console.log('1. Supabase Dashboard → Settings → API');
    console.log('2. Or in your .env.local file\n');
    process.exit(1);
  }

  console.log('🚀 Promoting judge account...\n');

  const success = await promoteJudge(judgeEmail, judgeName, serviceRoleKey);

  if (success) {
    console.log('\n✅ Judge account successfully promoted!\n');
  } else {
    console.error('\n❌ Failed to promote judge account\n');
    process.exit(1);
  }
}

main().catch(console.error);
