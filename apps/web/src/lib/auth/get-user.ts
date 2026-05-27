import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Role } from '@cenfer/shared';

export async function getAuthenticatedUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, rol')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    redirect('/login');
  }

  return {
    user,
    profile: profile as { id: string; nombre: string; apellido: string; rol: Role },
  };
}
