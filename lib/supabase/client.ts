import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * False when the Supabase env vars are not set (e.g. a fresh local checkout).
 * The app then runs without accounts or saved history instead of crashing.
 */
export const supabaseConfigured = Boolean(url && anonKey);

export function createClient() {
  // Placeholders keep the client constructible; callers check `supabaseConfigured` before using it.
  return createBrowserClient(url || 'http://localhost:54321', anonKey || 'not-configured');
}
