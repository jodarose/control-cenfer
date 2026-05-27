import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createSupabaseBrowserClient(url: string, anonKey: string) {
  return createBrowserClient<Database>(url, anonKey);
}
