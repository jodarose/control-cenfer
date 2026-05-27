import { describe, it, expect } from 'vitest';
import { ALL_ROLES } from '@cenfer/shared';

describe('roles wiring', () => {
  it('shared package exposes roles to web app', () => {
    expect(ALL_ROLES).toContain('super_admin');
  });
});
