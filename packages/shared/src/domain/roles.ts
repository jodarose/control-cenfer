export const ALL_ROLES = [
  'super_admin',
  'sst',
  'recepcion',
  'empresa',
  'portero',
  'persona',
] as const;

export type Role = (typeof ALL_ROLES)[number];

export function isAdminRole(role: Role): boolean {
  return role === 'super_admin';
}
