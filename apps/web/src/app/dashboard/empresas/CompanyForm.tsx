'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CompanySchema } from '@cenfer/shared';

export function CompanyForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    nit: '',
    razon_social: '',
    contacto_nombre: '',
    contacto_email: '',
    contacto_telefono: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const candidate = {
      ...form,
      contacto_telefono: form.contacto_telefono || undefined,
    };

    const parsed = CompanySchema.omit({ id: true, activa: true }).safeParse(candidate);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('companies').insert({
      ...parsed.data,
      activa: true,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/dashboard/empresas');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-3 rounded border bg-white p-4">
      <label className="block">
        <span className="text-sm">NIT (formato 900123456-7)</span>
        <input
          className="w-full rounded border px-2 py-1"
          value={form.nit}
          onChange={(e) => update('nit', e.target.value)}
          required
        />
      </label>
      <label className="block">
        <span className="text-sm">Razón social</span>
        <input
          className="w-full rounded border px-2 py-1"
          value={form.razon_social}
          onChange={(e) => update('razon_social', e.target.value)}
          required
        />
      </label>
      <label className="block">
        <span className="text-sm">Contacto: nombre</span>
        <input
          className="w-full rounded border px-2 py-1"
          value={form.contacto_nombre}
          onChange={(e) => update('contacto_nombre', e.target.value)}
          required
        />
      </label>
      <label className="block">
        <span className="text-sm">Contacto: email</span>
        <input
          type="email"
          className="w-full rounded border px-2 py-1"
          value={form.contacto_email}
          onChange={(e) => update('contacto_email', e.target.value)}
          required
        />
      </label>
      <label className="block">
        <span className="text-sm">Contacto: teléfono</span>
        <input
          className="w-full rounded border px-2 py-1"
          value={form.contacto_telefono}
          onChange={(e) => update('contacto_telefono', e.target.value)}
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-blue-600 px-3 py-1.5 text-white disabled:opacity-50"
      >
        {saving ? 'Guardando…' : 'Crear empresa'}
      </button>
    </form>
  );
}
