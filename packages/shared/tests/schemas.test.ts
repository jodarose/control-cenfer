import { describe, it, expect } from 'vitest';
import { ActivitySchema, AreaSchema, CompanySchema } from '../src';

describe('ActivitySchema', () => {
  it('valida actividad con campos correctos', () => {
    const result = ActivitySchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      nombre: 'Montaje stand',
      nivel_riesgo_default: 'medio',
      documentos_requeridos: ['cedula', 'arl', 'eps'],
      activa: true,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza actividad con nivel de riesgo inválido', () => {
    const result = ActivitySchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      nombre: 'Montaje',
      nivel_riesgo_default: 'extremo',
      documentos_requeridos: [],
      activa: true,
    });
    expect(result.success).toBe(false);
  });

  it('rechaza actividad con documento desconocido', () => {
    const result = ActivitySchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      nombre: 'Aseo',
      nivel_riesgo_default: 'bajo',
      documentos_requeridos: ['cedula', 'inexistente'],
      activa: true,
    });
    expect(result.success).toBe(false);
  });
});

describe('AreaSchema', () => {
  it('acepta área con descripción opcional', () => {
    expect(AreaSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      nombre: 'Pabellón A',
      activa: true,
    }).success).toBe(true);

    expect(AreaSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      nombre: 'Pabellón B',
      descripcion: 'Zona de eventos grandes',
      activa: true,
    }).success).toBe(true);
  });

  it('rechaza nombre vacío', () => {
    expect(AreaSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      nombre: '',
      activa: true,
    }).success).toBe(false);
  });
});

describe('CompanySchema', () => {
  it('valida empresa con NIT y email válidos', () => {
    const result = CompanySchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      nit: '900123456-7',
      razon_social: 'Construcciones Acme SAS',
      contacto_nombre: 'Juan Pérez',
      contacto_email: 'juan@acme.com',
      contacto_telefono: '+57 300 1234567',
      activa: true,
    });
    expect(result.success).toBe(true);
  });

  it('acepta NIT sin dígito de verificación', () => {
    expect(CompanySchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      nit: '900123456',
      razon_social: 'Acme',
      contacto_nombre: 'Juan',
      contacto_email: 'juan@acme.com',
      activa: true,
    }).success).toBe(true);
  });

  it('rechaza email inválido', () => {
    expect(CompanySchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      nit: '900123456-7',
      razon_social: 'Acme',
      contacto_nombre: 'Juan',
      contacto_email: 'no-es-email',
      activa: true,
    }).success).toBe(false);
  });

  it('rechaza NIT con letras', () => {
    expect(CompanySchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      nit: 'ABC123',
      razon_social: 'Acme',
      contacto_nombre: 'Juan',
      contacto_email: 'juan@acme.com',
      activa: true,
    }).success).toBe(false);
  });
});
