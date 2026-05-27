'use client';

import { useEffect, useState } from 'react';

type Porteria = { id: string; nombre: string; ubicacion: string | null };

export const PORTERIA_STORAGE_KEY = 'control-cenfer-porteria-id';

export function PorteriaSelector({ porterias }: { porterias: Porteria[] }) {
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem(PORTERIA_STORAGE_KEY);
    if (stored) setSelected(stored);
  }, []);

  function change(id: string) {
    setSelected(id);
    if (id) localStorage.setItem(PORTERIA_STORAGE_KEY, id);
    else localStorage.removeItem(PORTERIA_STORAGE_KEY);
  }

  if (porterias.length === 0) {
    return (
      <div className="rounded border bg-yellow-50 p-3 text-sm text-yellow-800">
        No hay porterías configuradas. Pide al admin que cree al menos una en /dashboard/admin/catalogos/porterias.
      </div>
    );
  }

  return (
    <div className="rounded border bg-white p-3">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Portería activa</span>
        <select
          className="w-full rounded border px-2 py-1"
          value={selected}
          onChange={(e) => change(e.target.value)}
        >
          <option value="">— selecciona —</option>
          {porterias.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
              {p.ubicacion ? ` (${p.ubicacion})` : ''}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
