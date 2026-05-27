import { z } from 'zod';

export const DocumentTypeKeySchema = z.enum([
  'cedula', 'arl', 'eps', 'pila', 'foto',
  'induccion', 'alturas', 'examen_medico',
]);

export const RiskLevelSchema = z.enum(['bajo', 'medio', 'alto']);

export const ActivitySchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(1).max(100),
  nivel_riesgo_default: RiskLevelSchema,
  documentos_requeridos: z.array(DocumentTypeKeySchema),
  activa: z.boolean(),
});

export type Activity = z.infer<typeof ActivitySchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
export type DocumentTypeKey = z.infer<typeof DocumentTypeKeySchema>;
