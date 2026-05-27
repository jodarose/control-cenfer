'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function RequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [motivo, setMotivo] = useState('');

  async function aprobar() {
    setBusy(true);
    setError(null);
    const { error: rpcError } = await (supabase as any).rpc('sst_approve_request', {
      p_request_id: requestId,
    });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    alert('Solicitud aprobada. Se generaron los QR para las personas autorizadas.');
    router.push('/dashboard/sst/bandeja');
    router.refresh();
  }

  async function rechazar() {
    if (!motivo.trim()) {
      setError('Motivo es obligatorio');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: rpcError } = await (supabase as any).rpc('sst_reject_request', {
      p_request_id: requestId,
      p_motivo: motivo.trim(),
    });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    router.push('/dashboard/sst/bandeja');
    router.refresh();
  }

  return (
    <section className="rounded border bg-gray-50 p-4">
      <h2 className="mb-2 font-semibold">Decisión final</h2>
      <p className="mb-3 text-sm text-gray-600">
        Para aprobar, todas las personas deben estar aprobadas o rechazadas (ninguna en revisión).
        Las personas aprobadas recibirán su credencial QR.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={aprobar}
          disabled={busy}
          className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? 'Procesando…' : 'Aprobar solicitud'}
        </button>
        <button
          type="button"
          onClick={() => setShowReject((s) => !s)}
          disabled={busy}
          className="rounded border border-red-600 px-4 py-2 text-red-600 disabled:opacity-50"
        >
          Rechazar solicitud
        </button>
      </div>
      {showReject && (
        <div className="mt-3 flex flex-col gap-2">
          <input
            className="rounded border px-2 py-1 text-sm"
            placeholder="Motivo del rechazo (requerido)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          <button
            type="button"
            onClick={rechazar}
            disabled={busy || motivo.trim().length === 0}
            className="self-start rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Confirmar rechazo
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
