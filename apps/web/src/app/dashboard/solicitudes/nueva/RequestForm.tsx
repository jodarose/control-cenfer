'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { RiskLevel } from '@cenfer/shared';

type Option = { id: string; nombre: string; nivel_riesgo_default?: RiskLevel };

const RISK_OPTIONS: RiskLevel[] = ['bajo', 'medio', 'alto'];

export function RequestForm() {
  const router = useRouter();
  const supabase = createClient();

  const [companies, setCompanies] = useState<Option[]>([]);
  const [activities, setActivities] = useState<Option[]>([]);
  const [areas, setAreas] = useState<Option[]>([]);

  const [form, setForm] = useState({
    company_id: '',
    activity_id: '',
    area_id: '',
    fecha_desde: '',
    fecha_hasta: '',
    horario_inicio: '06:00',
    horario_fin: '20:00',
    nivel_riesgo: 'bajo' as RiskLevel,
    cantidad_estimada: 1,
    observaciones: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, a, ar] = await Promise.all([
        supabase.from('companies').select('id, nombre:razon_social').eq('activa', true).order('razon_social'),
        supabase.from('activities').select('id, nombre, nivel_riesgo_default').eq('activa', true).order('nombre'),
        supabase.from('areas').select('id, nombre').eq('activa', true).order('nombre'),
      ]);
      setCompanies((c.data ?? []).map((r) => ({ id: r.id, nombre: r.nombre })));
      setActivities((a.data ?? []).map((r) => ({ id: r.id, nombre: r.nombre, nivel_riesgo_default: r.nivel_riesgo_default as RiskLevel | undefined })));
      setAreas((ar.data ?? []).map((r) => ({ id: r.id, nombre: r.nombre })));
    })();
  }, [supabase]);

  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function onActivityChange(id: string) {
    const act = activities.find((a) => a.id === id);
    setForm((p) => ({
      ...p,
      activity_id: id,
      nivel_riesgo: act?.nivel_riesgo_default ?? p.nivel_riesgo,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (form.fecha_hasta < form.fecha_desde) {
      setError('La fecha hasta debe ser igual o posterior a la fecha desde.');
      setSaving(false);
      return;
    }

    // Token expira 7 días después de fecha_hasta
    const expires = new Date(form.fecha_hasta);
    expires.setDate(expires.getDate() + 7);

    const { data, error } = await supabase
      .from('access_requests')
      .insert({
        company_id: form.company_id,
        activity_id: form.activity_id,
        area_id: form.area_id || null,
        fecha_desde: form.fecha_desde,
        fecha_hasta: form.fecha_hasta,
        horario_inicio: form.horario_inicio,
        horario_fin: form.horario_fin,
        nivel_riesgo: form.nivel_riesgo,
        cantidad_estimada: form.cantidad_estimada,
        observaciones: form.observaciones || null,
        estado: 'enviada',
        public_token_expires_at: expires.toISOString(),
      })
      .select('id')
      .single();

    setSaving(false);
    if (error || !data) {
      setError(error?.message ?? 'No se pudo crear la solicitud');
      return;
    }
    router.push(`/dashboard/solicitudes/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-3 rounded border bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm">Empresa</span>
          <select required className="w-full rounded border px-2 py-1" value={form.company_id} onChange={(e) => update('company_id', e.target.value)}>
            <option value="">— seleccionar —</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm">Actividad</span>
          <select required className="w-full rounded border px-2 py-1" value={form.activity_id} onChange={(e) => onActivityChange(e.target.value)}>
            <option value="">— seleccionar —</option>
            {activities.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm">Área</span>
          <select className="w-full rounded border px-2 py-1" value={form.area_id} onChange={(e) => update('area_id', e.target.value)}>
            <option value="">— sin área específica —</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm">Nivel de riesgo</span>
          <select required className="w-full rounded border px-2 py-1" value={form.nivel_riesgo} onChange={(e) => update('nivel_riesgo', e.target.value as RiskLevel)}>
            {RISK_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm">Fecha desde</span>
          <input type="date" required className="w-full rounded border px-2 py-1" value={form.fecha_desde} onChange={(e) => update('fecha_desde', e.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm">Fecha hasta</span>
          <input type="date" required className="w-full rounded border px-2 py-1" value={form.fecha_hasta} onChange={(e) => update('fecha_hasta', e.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm">Horario inicio</span>
          <input type="time" required className="w-full rounded border px-2 py-1" value={form.horario_inicio} onChange={(e) => update('horario_inicio', e.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm">Horario fin</span>
          <input type="time" required className="w-full rounded border px-2 py-1" value={form.horario_fin} onChange={(e) => update('horario_fin', e.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm">Cantidad estimada</span>
          <input type="number" min={1} required className="w-full rounded border px-2 py-1" value={form.cantidad_estimada} onChange={(e) => update('cantidad_estimada', Number(e.target.value))} />
        </label>
      </div>
      <label className="block">
        <span className="text-sm">Observaciones</span>
        <textarea className="w-full rounded border px-2 py-1" rows={3} value={form.observaciones} onChange={(e) => update('observaciones', e.target.value)} />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="rounded bg-blue-600 px-3 py-1.5 text-white disabled:opacity-50">
        {saving ? 'Creando…' : 'Crear solicitud y obtener link'}
      </button>
    </form>
  );
}
