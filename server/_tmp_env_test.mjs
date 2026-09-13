import('dotenv/config');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING');
console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'SET' : 'MISSING');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'MISSING');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET (length:' + process.env.SUPABASE_ANON_KEY.length + ')' : 'MISSING');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET (starts:' + process.env.RESEND_API_KEY.slice(0,10) + '...)' : 'MISSING');
console.log('ENV_FILE:', process.env.DOTENV_CONFIG_PATH || 'not set');
