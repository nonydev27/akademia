/**
 * Diagnoses login against the deployed server.
 * Run: node scripts/diag-deployed.mjs
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import https from 'https';

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.SEED_SUPER_ADMIN_EMAIL || 'karldjansi123@gmail.com';
const PASSWORD = process.env.SEED_SUPER_ADMIN_PASSWORD || 'Nonydev252729';
const API = 'https://akademia-api-3ck5.onrender.com';

const anonClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function httpsGet(url, token) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, path: u.pathname, method: 'GET',
      headers: token ? { Authorization: 'Bearer ' + token } : {},
      timeout: 20000,
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('timeout', () => { resolve({ status: 0, body: 'TIMEOUT' }); req.destroy(); });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.end();
  });
}

console.log('=== 1. Sign in via Supabase (anon key) ===');
const { data: signIn, error: signInErr } = await anonClient.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
if (signInErr) {
  console.log('FAIL:', signInErr.message);
  process.exit(1);
}
const token = signIn.session.access_token;
const supabaseUserId = signIn.user.id;
console.log('OK  supabase user id:', supabaseUserId);
console.log('    token (first 40):', token.slice(0, 40) + '...');

console.log('\n=== 2. Confirm user exists in Supabase Auth (service key) ===');
const { data: authList } = await adminClient.auth.admin.listUsers({ perPage: 50 });
const authUser = authList?.users?.find(u => u.email === EMAIL);
if (!authUser) {
  console.log('FAIL: user not found in Supabase Auth at all');
} else {
  console.log('OK  auth user:', authUser.id, '| email_confirmed:', authUser.email_confirmed_at ? 'yes' : 'NO');
}

console.log('\n=== 3. Call deployed /health ===');
const health = await httpsGet(`${API}/health`);
console.log('Status:', health.status, '| Body:', health.body);

console.log('\n=== 4. Call deployed /api/v1/auth/me with token ===');
const me = await httpsGet(`${API}/api/v1/auth/me`, token);
console.log('Status:', me.status);
console.log('Body:', me.body);

if (me.status === 401) {
  const parsed = JSON.parse(me.body);
  console.log('\n>>> DIAGNOSIS: Server returned 401 with message:', parsed?.message);
  console.log('    This means: Supabase login succeeded, but the server cannot find');
  console.log('    a User row in its Prisma DB with supabaseId =', supabaseUserId);
  console.log('    The deployed server may point to a DIFFERENT database or the');
  console.log('    migration did not seed the user in the deployed DB.');
}
