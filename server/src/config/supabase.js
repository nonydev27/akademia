/**
 * config/supabase.js — Supabase service-role client singleton.
 *
 * Used for verifying user access tokens issued by Supabase Auth and for
 * admin-only operations (creating auth users on tenant bootstrap, uploading
 * report cards to Storage). Never expose the service-role key to the client.
 */

import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
