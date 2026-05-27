import { z } from 'zod';

export const AreaSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(1).max(100),
  descripcion: z.string().max(500).nullable().optional(),
  activa: z.boolean(),
});

export type Area = z.infer<typeof AreaSchema>;
