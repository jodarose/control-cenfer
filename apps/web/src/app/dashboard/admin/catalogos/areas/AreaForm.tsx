'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AreaForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from('areas').insert({
      nombre,
      descripcion: descripcion || null,
      activa: true,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNombre('');
    setDescripcion('');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded border bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Nueva área</h2>
      <label className="mb-2 block">
        <span className="text-sm">Nombre</span>
        <input
          className="block w-full rounded border px-2 py-1"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </label>
      <label className="mb-3 block">
        <span className="text-sm">Descripción (opcional)</span>
        <input
          className="block w-full rounded border px-2 py-1"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </label>
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
