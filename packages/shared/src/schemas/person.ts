import { z } from 'zod';

export const PersonSchema = z.object({
  id: z.string().uuid(),
  cedula: z.string().regex(/^\d{6,12}$/, 'Cédula debe ser 6-12 dígitos'),
  nombre: z.string().min(1).max(100),
  apellido: z.string().min(1).max(100),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  eps: z.string().optional(),
  arl: z.string().optional(),
  cargo: z.string().optional(),
  foto_url: z.string().url().nullable().optional(),
  company_id: z.string().uuid(),
});

export type Person = z.infer<typeof PersonSchema>;
