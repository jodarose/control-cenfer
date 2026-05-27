import { z } from 'zod';
import { ALL_ROLES } from '../domain/roles';

export const RoleSchema = z.enum(ALL_ROLES);

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(1).max(100),
  apellido: z.string().min(1).max(100),
  telefono: z.string().regex(/^\+?[\d\s-]{7,15}$/).optional(),
  rol: RoleSchema,
});

export type Profile = z.infer<typeof ProfileSchema>;
