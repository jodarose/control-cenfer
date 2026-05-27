'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { RiskLevel, DocumentTypeKey } from '@cenfer/shared';

const RISK_OPTIONS: RiskLevel[] = ['bajo', 'medio', 'alto'];
const DOC_OPTIONS: DocumentTypeKey[] = [
  'cedula', 'arl', 'eps', 'pila', 'foto', 'induccion', 'alturas', 'examen_medico',
];

export function ActivityForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [riesgo, setRiesgo] = useState<RiskLevel>('bajo');
  const [docs, setDocs] = useState<DocumentTypeKey[]>([
    'cedula', 'arl', 'eps', 'pila', 'foto', 'induccion',
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from('activities').insert({
      nombre,
      nivel_riesgo_default: riesgo,
      documentos_requeridos: docs,
      activa: true,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNombre('');
    router.refresh();
  }

  function toggleDoc(d: DocumentTypeKey) {
    setDocs((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded border bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Nueva actividad</h2>
      <label className="mb-2 block">
        <span className="text-sm">Nombre</span>
        <input
          className="block w-full rounded border px-2 py-1"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </label>
      <label className="mb-2 block">
        <span className="text-sm">Nivel de riesgo</span>
        <select
          className="block w-full rounded border px-2 py-1"
          value={riesgo}
          onChange={(e) => setRiesgo(e.target.value as RiskLevel)}
        >
          {RISK_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </label>
      <fieldset className="mb-3">
        <legend className="text-sm">Documentos requeridos</legend>
        <div className="grid grid-cols-2 gap-1 text-sm">
          {DOC_OPTIONS.map((d) => (
            <label key={d} className="flex items-center gap-2">
              <input type="checkbox" checked={docs.includes(d)} onChange={() => toggleDoc(d)} />
              {d}
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-blue-600 px-3 py-1.5 text-white disabled:opacity-50"
      >
        {saving ? 'Guardando…' : 'Crear'}
      </button>
    </form>
  );
}
