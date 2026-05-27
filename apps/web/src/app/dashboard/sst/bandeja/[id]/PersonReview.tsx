'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { PersonRequestStatus, DocumentTypeKey } from '@cenfer/shared';

type Document = {
  id: string;
  document_type: DocumentTypeKey;
  archivo_url: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  motivo_rechazo: string | null;
};

type Person = {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  foto_url: string | null;
  documents: Document[];
};

const statusColor: Record<PersonRequestStatus, string> = {
  pendiente_docs: 'bg-yellow-100 text-yellow-800',
  en_revision: 'bg-blue-100 text-blue-800',
  aprobada: 'bg-green-100 text-green-800',
  rechazada: 'bg-red-100 text-red-800',
};

export function PersonReview({
  requestPersonId,
  estadoIndividual,
  person,
  documentosRequeridos,
}: {
  requestPersonId: string;
  estadoIndividual: PersonRequestStatus;
  person: Person;
  documentosRequeridos: DocumentTypeKey[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [rejectingDoc, setRejectingDoc] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docMap = new Map(person.documents.map((d) => [d.document_type, d]));

  async function openSignedUrl(doc: Document) {
    if (signedUrls[doc.id]) {
      window.open(signedUrls[doc.id], '_blank');
      return;
    }
    const { data, error: storageError } = await supabase.storage
      .from('documentos')
      .createSignedUrl(doc.archivo_url, 300);
    if (storageError || !data) {
      setError(`No se pudo abrir: ${storageError?.message ?? 'unknown'}`);
      return;
    }
    setSignedUrls((s) => ({ ...s, [doc.id]: data.signedUrl }));
    window.open(data.signedUrl, '_blank');
  }

  async function reviewDoc(docId: string, estado: 'aprobado' | 'rechazado', mot?: string) {
    setBusy(true);
    setError(null);
    const { error: rpcError } = await (supabase as any).rpc('sst_review_document', {
      p_document_id: docId,
      p_estado: estado,
      p_motivo_rechazo: mot ?? null,
    });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setRejectingDoc(null);
    setMotivo('');
    router.refresh();
  }

  return (
    <div className="rounded border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200">
            {person.foto_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.foto_url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div>
            <strong>
              {person.nombre} {person.apellido}
            </strong>
            <p className="text-sm text-gray-500">CC {person.cedula}</p>
          </div>
        </div>
        <span className={`rounded px-2 py-1 text-xs ${statusColor[estadoIndividual]}`}>
          {estadoIndividual}
        </span>
      </div>

      <table className="w-full text-sm">
        <tbody>
          {documentosRequeridos.map((d) => {
            const doc = docMap.get(d);
            if (!doc) {
              return (
                <tr key={d} className="border-t">
                  <td className="py-2">{d}</td>
                  <td className="py-2 text-gray-500">No subido aún</td>
                  <td className="py-2"></td>
                </tr>
              );
            }
            const vencido =
              doc.fecha_vencimiento && new Date(doc.fecha_vencimiento) < new Date();
            return (
              <tr key={d} className="border-t align-top">
                <td className="py-2">
                  {d}
                  {doc.fecha_vencimiento && (
                    <p className={`text-xs ${vencido ? 'text-red-600' : 'text-gray-500'}`}>
                      {vencido ? 'VENCIDO ' : 'vence '}
                      {doc.fecha_vencimiento}
                    </p>
                  )}
                </td>
                <td className="py-2">
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
                  </span>
                  {doc.motivo_rechazo && (
                    <p className="mt-1 text-xs text-red-600">{doc.motivo_rechazo}</p>
                  )}
                </td>
                <td className="py-2 text-right">
                  <div className="flex flex-wrap justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openSignedUrl(doc)}
                      className="rounded border px-2 py-0.5 text-xs hover:bg-gray-50"
                    >
                      Ver archivo
                    </button>
                    {doc.estado !== 'aprobado' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => reviewDoc(doc.id, 'aprobado')}
                        className="rounded bg-green-600 px-2 py-0.5 text-xs text-white disabled:opacity-50"
                      >
                        Aprobar
                      </button>
                    )}
                    {doc.estado !== 'rechazado' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setRejectingDoc(doc.id)}
                        className="rounded bg-red-600 px-2 py-0.5 text-xs text-white disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    )}
                  </div>
                  {rejectingDoc === doc.id && (
                    <div className="mt-2 flex flex-col gap-1">
                      <input
                        autoFocus
                        className="rounded border px-2 py-1 text-xs"
                        placeholder="Motivo del rechazo (requerido)"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                      />
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingDoc(null);
                            setMotivo('');
                          }}
                          className="rounded border px-2 py-0.5 text-xs"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={busy || motivo.trim().length === 0}
                          onClick={() => reviewDoc(doc.id, 'rechazado', motivo.trim())}
                          className="rounded bg-red-600 px-2 py-0.5 text-xs text-white disabled:opacity-50"
                        >
                          Confirmar rechazo
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
