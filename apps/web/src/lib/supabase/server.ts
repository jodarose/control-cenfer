import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@cenfer/supabase';

export function createClient() {
  const cookieStore = cookies();
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Component contexts no permiten set
        }
      },
      remove: (name, options) => {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {}
      },
    },
  );
}
