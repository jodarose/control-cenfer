import { z } from 'zod';
import { RiskLevelSchema } from './activity';

export const AccessRequestStatusSchema = z.enum([
  'borrador',
  'enviada',
  'en_carga',
  'en_revision_sst',
  'aprobada',
  'rechazada',
  'vigente',
  'vencida',
  'cancelada',
]);

export const PersonRequestStatusSchema = z.enum([
  'pendiente_docs',
  'en_revision',
  'aprobada',
  'rechazada',
]);

const dateStringRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeStringRegex = /^\d{2}:\d{2}$/;

export const AccessRequestSchema = z
  .object({
    id: z.string().uuid(),
    company_id: z.string().uuid(),
    activity_id: z.string().uuid(),
    area_id: z.string().uuid().nullable(),
    fecha_desde: z.string().regex(dateStringRegex, 'Fecha desde inválida'),
    fecha_hasta: z.string().regex(dateStringRegex, 'Fecha hasta inválida'),
    horario_inicio: z.string().regex(timeStringRegex, 'Horario inicio inválido'),
    horario_fin: z.string().regex(timeStringRegex, 'Horario fin inválido'),
    nivel_riesgo: RiskLevelSchema,
    cantidad_estimada: z.number().int().positive(),
    observaciones: z.string().max(2000).optional(),
    estado: AccessRequestStatusSchema,
  })
  .refine((d) => d.fecha_hasta >= d.fecha_desde, {
    message: 'fecha_hasta debe ser >= fecha_desde',
    path: ['fecha_hasta'],
  });

export type AccessRequest = z.infer<typeof AccessRequestSchema>;
export type AccessRequestStatus = z.infer<typeof AccessRequestStatusSchema>;
export type PersonRequestStatus = z.infer<typeof PersonRequestStatusSchema>;
