import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, hasSupabase } from '@/lib/env';

let cached: SupabaseClient | null = null;

/**
 * Service-role Supabase client for server-side use only. Authorization is
 * enforced in the app layer via Clerk identity; RLS on the database provides
 * defense in depth for any non-service access path.
 *
 * Returns null when Supabase env is not configured so the app can build and
 * render (with empty data) before provisioning completes.
 */
export function getServiceClient(): SupabaseClient | null {
  if (!hasSupabase) return null;
  if (!cached) {
    cached = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
