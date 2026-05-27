import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from './get-user';
import type { Role } from '@cenfer/shared';

export async function requireRole(allowed: Role[]) {
  const { profile, user } = await getAuthenticatedUser();
  if (!allowed.includes(profile.rol)) {
    redirect('/dashboard');
  }
  return { profile, user };
}
