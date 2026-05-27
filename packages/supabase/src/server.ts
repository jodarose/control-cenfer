import { createServerClient } from '@supabase/ssr';
import type { Database } from './types';

export function createSupabaseServerClient(
  url: string,
  anonKey: string,
  cookies: {
    get: (name: string) => string | undefined;
    set: (name: string, value: string, options: Record<string, unknown>) => void;
    remove: (name: string, options: Record<string, unknown>) => void;
  },
) {
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get: cookies.get,
      set: cookies.set,
      remove: cookies.remove,
    },
  });
}
