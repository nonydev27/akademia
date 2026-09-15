import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import fs from 'fs';

const SUPABASE_URL = 'https://auejtnqoedlardvdhpki.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__CDvrWcWoqLy-UVvjZxP7w_ZUsKYLbh';
const API_URL = 'https://akademia-api-3ck5.onrender.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const EMAIL = 'karldjansi123@gmail.com';
  const PASSWORD = 'Nonydev252729';

  console.log('=== [1] Supabase sign-in ===');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (authError) {
    console.log('✗ Sign-in failed:', authError.message);
    return;
  }
  const token = authData.session.access_token;
  console.log('✓ Got access token:', token.slice(0, 40) + '...');

  console.log('\n=== [2] Check token via Supabase ===');
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError) {
    console.log('✗ Token verify failed:', userError.message);
    return;
  }
  console.log('✓ Token valid, user:', userData.user.id);

  console.log('\n=== [3] Call deployed server /me ===');
  try {
    const res = await axios.get(`${API_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    });
    console.log('✓ Server /me OK:', JSON.stringify(res.data, null, 2).slice(0, 500));
  } catch (err) {
    console.log('✗ Server /me failed:', err.response?.status, err.response?.data);
    if (err.code === 'ECONNABORTED') console.log('  (timeout)');
    if (err.code === 'ENOTFOUND') console.log('  (DNS failure)');
    if (err.code === 'ECONNREFUSED') console.log('  (connection refused)');
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
