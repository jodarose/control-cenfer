import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@cenfer/supabase';

// Anonymous client for the public portal — no auth session, just anon key.
// All writes go through SECURITY DEFINER RPCs that validate the token.
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
