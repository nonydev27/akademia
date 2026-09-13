const BASE = 'http://localhost:5000/api/v1';
let passed = 0, failed = 0;
const results = [];
function check(name, ok, detail = '') {
  if (ok) { passed++; results.push(`✅ ${name}`); }
  else { failed++; results.push(`❌ ${name} ${detail}`); }
}
async function req(path, opts = {}) {
  try {
    const res = await fetch(BASE + path, { ...opts, redirect: 'manual' });
    return { status: res.status, ok: res.ok, data: await res.json().catch(() => null) };
  } catch (e) { return { status: 0, ok: false, error: e.message }; }
}
async function main() {
  const health = await req('/health', { method: 'GET' });
  check('Health', health.status === 200);

  const terms = await req('/terms', { method: 'GET' });
  check('Terms list (no auth - should 401)', terms.status === 401, `got ${terms.status}`);

  const resetPwd = await req('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com' }),
    headers: { 'Content-Type': 'application/json' },
  });
  check('Forgot password (no auth - should 401)', resetPwd.status === 401, `got ${resetPwd.status}`);

  const resetPwd2 = await req('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: 'test', newPassword: 'Test12345' }),
    headers: { 'Content-Type': 'application/json' },
  });
  check('Reset password (no auth - should 401)', resetPwd2.status === 401, `got ${resetPwd2.status}`);

  const importTest = await req('/import/test', { method: 'POST' });
  check('Import endpoint exists', importTest.status === 401, `got ${importTest.status}`);

  const login = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'superadmin@akademia.app', password: 'ChangeMe123!' }),
    headers: { 'Content-Type': 'application/json' },
  });
  check('Login endpoint exists', [200, 401, 400].includes(login.status), `got ${login.status}`);

  const me = await req('/auth/me');
  check('Me endpoint (no auth - should 401)', me.status === 401, `got ${me.status}`);

  const students = await req('/students', { method: 'GET' });
  check('Students endpoint (no auth - should 401)', students.status === 401, `got ${students.status}`);

  console.log(results.join('\n'));
  console.log(`\n${passed} passed, ${failed} failed`);
}
main().catch(console.error);
