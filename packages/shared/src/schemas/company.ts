import { z } from 'zod';

export const CompanySchema = z.object({
  id: z.string().uuid(),
  nit: z.string().regex(/^\d{6,12}(-\d)?$/, 'NIT inválido (formato: 900123456-7)'),
  razon_social: z.string().min(1).max(200),
  contacto_nombre: z.string().min(1).max(100),
  contacto_email: z.string().email(),
  contacto_telefono: z.string().regex(/^\+?[\d\s-]{7,15}$/).optional(),
  activa: z.boolean(),
});

export type Company = z.infer<typeof CompanySchema>;
