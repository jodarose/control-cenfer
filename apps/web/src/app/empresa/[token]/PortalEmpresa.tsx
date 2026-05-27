'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPublicClient } from '@/lib/supabase/public-client';
import type { DocumentTypeKey, PersonRequestStatus } from '@cenfer/shared';
// Portal-side gate: company can submit if there's at least one person and none are rechazada.
// (canSubmitRequest from shared is used by SST approval flow, not portal submit.)

type RequestMeta = {
  id: string;
  company_razon_social: string;
  activity_nombre: string;
  documentos_requeridos: DocumentTypeKey[];
  area_nombre: string | null;
  fecha_desde: string;
  fecha_hasta: string;
  horario_inicio: string;
  horario_fin: string;
  nivel_riesgo: string;
  cantidad_estimada: number;
  observaciones: string | null;
  estado: string;
  public_token_expires_at: string;
};

type PersonDocument = {
  document_type: DocumentTypeKey;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  archivo_url: string;
};

type RequestPerson = {
  request_person_id: string;
  person_id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  cargo: string | null;
  estado_individual: PersonRequestStatus;
  documents: PersonDocument[];
};

export function PortalEmpresa({
  token,
  request,
}: {
  token: string;
  request: RequestMeta;
}) {
  const supabase = createPublicClient();
  const [people, setPeople] = useState<RequestPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadPeople = useCallback(async () => {
    setLoading(true);
    const { data, error: rpcError } = await (supabase as any).rpc(
      'public_get_request_people',
      { p_token: token },
    );
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setPeople((data as unknown as RequestPerson[]) ?? []);
  }, [supabase, token]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  async function handleSubmitToSst() {
    setError(null);
    if (people.length === 0) {
      setError('Agrega al menos una persona antes de enviar.');
      return;
    }
    if (people.some((p) => p.estado_individual === 'rechazada')) {
      setError('Hay personas rechazadas. Resuélvelo con SST antes de reenviar.');
      return;
    }
    setSubmitting(true);
    const { error: rpcError } = await (supabase as any).rpc(
      'public_submit_request_to_sst',
      { p_token: token },
    );
    setSubmitting(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    alert(
      'Solicitud enviada a revisión SST. Recibirás la confirmación por email cuando esté lista.',
    );
    loadPeople();
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="mb-6 rounded border bg-white p-4">
        <h1 className="text-2xl font-bold">{request.company_razon_social}</h1>
        <p className="text-sm text-gray-600">
          Actividad: <strong>{request.activity_nombre}</strong> · Riesgo{' '}
          {request.nivel_riesgo} · {request.fecha_desde} → {request.fecha_hasta}{' '}
          · {request.horario_inicio}–{request.horario_fin}
        </p>
        {request.area_nombre && (
          <p className="text-sm text-gray-600">Área: {request.area_nombre}</p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Link válido hasta:{' '}
          {new Date(request.public_token_expires_at).toLocaleString('es-CO')}
        </p>
      </header>

      <section className="mb-6 rounded border bg-blue-50 p-4 text-sm">
        <h2 className="mb-1 font-semibold">Documentos requeridos por persona</h2>
        <ul className="list-disc pl-5">
          {request.documentos_requeridos.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>

      <AddPersonForm token={token} onAdded={loadPeople} />

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">Personas asignadas</h2>
        {loading && <p className="text-sm text-gray-500">Cargando…</p>}
        {!loading && people.length === 0 && (
          <p className="text-sm text-gray-500">
            Aún no hay personas. Agrega la primera arriba.
          </p>
        )}
        <div className="space-y-3">
          {people.map((p) => (
            <PersonCard
              key={p.request_person_id}
              token={token}
              person={p}
              requiredDocs={request.documentos_requeridos}
              onChange={loadPeople}
            />
          ))}
        </div>
      </section>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmitToSst}
        disabled={submitting || people.length === 0}
        className="mt-6 rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting ? 'Enviando…' : 'Enviar a SST'}
      </button>
    </main>
  );
}

function AddPersonForm({
  token,
  onAdded,
}: {
  token: string;
  onAdded: () => void;
}) {
  const supabase = createPublicClient();
  const [form, setForm] = useState({
    cedula: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    cargo: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error: rpcError } = await (supabase as any).rpc(
      'public_add_person_to_request',
      {
        p_token: token,
        p_cedula: form.cedula,
        p_nombre: form.nombre,
        p_apellido: form.apellido,
        p_telefono: form.telefono || null,
        p_email: form.email || null,
        p_cargo: form.cargo || null,
      },
    );
    setSaving(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setForm({
      cedula: '',
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      cargo: '',
    });
    onAdded();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded border bg-white p-4">
      <h2 className="mb-2 font-semibold">Agregar persona</h2>
      <div className="grid grid-cols-2 gap-2">
        <input
          className="rounded border px-2 py-1"
          placeholder="Cédula"
          required
          value={form.cedula}
          onChange={(e) => update('cedula', e.target.value)}
        />
        <input
          className="rounded border px-2 py-1"
          placeholder="Nombre"
          required
          value={form.nombre}
          onChange={(e) => update('nombre', e.target.value)}
        />
        <input
          className="rounded border px-2 py-1"
          placeholder="Apellido"
          required
          value={form.apellido}
          onChange={(e) => update('apellido', e.target.value)}
        />
        <input
          type="email"
          className="rounded border px-2 py-1"
          placeholder="Email (opcional)"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
        />
        <input
          className="rounded border px-2 py-1"
          placeholder="Teléfono (opcional)"
          value={form.telefono}
          onChange={(e) => update('telefono', e.target.value)}
        />
        <input
          className="rounded border px-2 py-1"
          placeholder="Cargo (opcional)"
          value={form.cargo}
          onChange={(e) => update('cargo', e.target.value)}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="mt-2 rounded bg-blue-600 px-3 py-1.5 text-white disabled:opacity-50"
      >
        {saving ? 'Agregando…' : 'Agregar persona'}
      </button>
    </form>
  );
}

function PersonCard({
  token,
  person,
  requiredDocs,
  onChange,
}: {
  token: string;
  person: RequestPerson;
  requiredDocs: DocumentTypeKey[];
  onChange: () => void;
}) {
  const supabase = createPublicClient();
  const docMap = new Map(person.documents.map((d) => [d.document_type, d]));

  async function handleUpload(
    docType: DocumentTypeKey,
    file: File,
    fechaVencimiento?: string,
  ) {
    if (file.size > 2 * 1024 * 1024) {
      alert('Archivo demasiado grande (máx 2 MB)');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
    const path = `${person.person_id}/${docType}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('documentos')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      alert(`Upload falló: ${upErr.message}`);
      return;
    }
    const { error: rpcErr } = await (supabase as any).rpc(
      'public_save_person_document',
      {
        p_token: token,
        p_person_id: person.person_id,
        p_document_type: docType,
        p_archivo_url: path,
        p_fecha_emision: null,
        p_fecha_vencimiento: fechaVencimiento ?? null,
      },
    );
    if (rpcErr) {
      alert(`Guardar documento falló: ${rpcErr.message}`);
      return;
    }
    onChange();
  }

  const statusColor: Record<PersonRequestStatus, string> = {
    pendiente_docs: 'bg-yellow-100 text-yellow-800',
    en_revision: 'bg-blue-100 text-blue-800',
    aprobada: 'bg-green-100 text-green-800',
    rechazada: 'bg-red-100 text-red-800',
  };

  return (
    <div className="rounded border bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <strong>
            {person.nombre} {person.apellido}
          </strong>
          <span className="ml-2 text-sm text-gray-500">CC {person.cedula}</span>
        </div>
        <span
          className={`rounded px-2 py-0.5 text-xs ${statusColor[person.estado_individual]}`}
        >
          {person.estado_individual}
        </span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {requiredDocs.map((d) => {
            const doc = docMap.get(d);
            return (
              <tr key={d} className="border-t">
                <td className="py-1 pr-2">{d}</td>
                <td className="py-1">
                  {doc ? (
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        doc.estado === 'aprobado'
                          ? 'bg-green-100 text-green-800'
                          : doc.estado === 'rechazado'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {doc.estado}
                      {doc.fecha_vencimiento
                        ? ` · vence ${doc.fecha_vencimiento}`
                        : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">no subido</span>
                  )}
                </td>
                <td className="py-1 text-right">
                  <UploadButton
                    onUpload={(f, fv) => handleUpload(d, f, fv)}
                    requiresVencimiento={d !== 'cedula' && d !== 'foto'}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UploadButton({
  onUpload,
  requiresVencimiento,
}: {
  onUpload: (file: File, fechaVencimiento?: string) => void;
  requiresVencimiento: boolean;
}) {
  const [vencimiento, setVencimiento] = useState('');
  return (
    <span className="inline-flex items-center gap-1">
      {requiresVencimiento && (
        <input
          type="date"
          className="rounded border px-1 py-0.5 text-xs"
          value={vencimiento}
          onChange={(e) => setVencimiento(e.target.value)}
          title="Fecha de vencimiento"
        />
      )}
      <label className="cursor-pointer rounded bg-blue-600 px-2 py-1 text-xs text-white">
        Subir
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (requiresVencimiento && !vencimiento) {
              alert('Indica la fecha de vencimiento del documento');
              return;
            }
            onUpload(f, vencimiento || undefined);
            e.target.value = '';
          }}
        />
      </label>
    </span>
  );
}
