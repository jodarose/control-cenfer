import { describe, it, expect } from 'vitest';
import { Role, isAdminRole, ALL_ROLES } from '../src/domain/roles';

describe('roles', () => {
  it('exposes all 6 roles', () => {
    expect(ALL_ROLES).toEqual([
      'super_admin',
      'sst',
      'recepcion',
      'empresa',
      'portero',
      'persona',
    ]);
  });

  it('identifies admin roles', () => {
    expect(isAdminRole('super_admin')).toBe(true);
    expect(isAdminRole('sst')).toBe(false);
    expect(isAdminRole('empresa')).toBe(false);
  });
});
