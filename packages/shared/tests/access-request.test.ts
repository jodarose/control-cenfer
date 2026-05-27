import { describe, it, expect } from 'vitest';
import { AccessRequestSchema, PersonSchema, canSubmitRequest } from '../src';

describe('AccessRequestSchema', () => {
  const base = {
    id: '00000000-0000-0000-0000-000000000001',
    company_id: '00000000-0000-0000-0000-000000000002',
    activity_id: '00000000-0000-0000-0000-000000000003',
    area_id: null,
    fecha_desde: '2026-06-01',
    fecha_hasta: '2026-06-10',
    horario_inicio: '06:00',
    horario_fin: '20:00',
    nivel_riesgo: 'medio' as const,
    cantidad_estimada: 5,
    estado: 'borrador' as const,
  };

  it('acepta una solicitud válida', () => {
    expect(AccessRequestSchema.safeParse(base).success).toBe(true);
  });

  it('rechaza fecha_hasta anterior a fecha_desde', () => {
    expect(AccessRequestSchema.safeParse({
      ...base,
      fecha_desde: '2026-06-10',
      fecha_hasta: '2026-06-01',
    }).success).toBe(false);
  });

  it('rechaza cantidad_estimada cero o negativa', () => {
    expect(AccessRequestSchema.safeParse({ ...base, cantidad_estimada: 0 }).success).toBe(false);
    expect(AccessRequestSchema.safeParse({ ...base, cantidad_estimada: -3 }).success).toBe(false);
  });

  it('rechaza estado desconocido', () => {
    expect(AccessRequestSchema.safeParse({ ...base, estado: 'inventado' }).success).toBe(false);
  });

  it('rechaza horario en formato inválido', () => {
    expect(AccessRequestSchema.safeParse({ ...base, horario_inicio: '6am' }).success).toBe(false);
  });
});

describe('PersonSchema', () => {
  const base = {
    id: '00000000-0000-0000-0000-000000000001',
    cedula: '1023456789',
    nombre: 'María',
    apellido: 'Pérez',
    company_id: '00000000-0000-0000-0000-000000000002',
  };

  it('acepta persona mínima válida', () => {
    expect(PersonSchema.safeParse(base).success).toBe(true);
  });

  it('rechaza cédula con letras', () => {
    expect(PersonSchema.safeParse({ ...base, cedula: 'ABC123' }).success).toBe(false);
  });

  it('rechaza cédula muy corta', () => {
    expect(PersonSchema.safeParse({ ...base, cedula: '12345' }).success).toBe(false);
  });
});

describe('canSubmitRequest', () => {
  it('rechaza solicitud sin personas', () => {
    expect(canSubmitRequest({ people: [] })).toEqual({
      ok: false,
      reason: 'sin_personas',
    });
  });

  it('rechaza si alguna persona tiene docs pendientes', () => {
    expect(canSubmitRequest({
      people: [
        { estado_individual: 'aprobada' },
        { estado_individual: 'pendiente_docs' },
      ],
    })).toEqual({ ok: false, reason: 'docs_pendientes' });
  });

  it('rechaza si alguna persona fue rechazada', () => {
    expect(canSubmitRequest({
      people: [{ estado_individual: 'rechazada' }],
    })).toEqual({ ok: false, reason: 'docs_pendientes' });
  });

  it('acepta si todas las personas están aprobadas', () => {
    expect(canSubmitRequest({
      people: [
        { estado_individual: 'aprobada' },
        { estado_individual: 'aprobada' },
      ],
    })).toEqual({ ok: true });
  });

  it('acepta si todas las personas están en revisión (sin pendientes)', () => {
    expect(canSubmitRequest({
      people: [
        { estado_individual: 'en_revision' },
        { estado_individual: 'aprobada' },
      ],
    })).toEqual({ ok: true });
  });
});
