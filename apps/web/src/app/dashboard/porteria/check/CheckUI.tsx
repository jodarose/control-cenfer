'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

const PORTERIA_STORAGE_KEY = 'control-cenfer-porteria-id';

const motivoMap: Record<string, string> = {
  no_encontrado: 'Persona no encontrada o sin solicitud vigente',
  persona_no_aprobada: 'La persona no está aprobada por SST',
  solicitud_no_vigente: 'La solicitud no está aprobada/vigente',
  fuera_rango_fechas_anterior: 'La solicitud aún no empieza',
  fuera_rango_fechas_posterior: 'La solicitud ya venció',
  credencial_vencida: 'La credencial venció',
  fuera_horario: 'Fuera del horario permitido',
  ya_dentro: 'La persona ya está adentro (último evento: entrada)',
  ya_fuera: 'La persona ya salió (último evento: salida)',
};

type RpcResult = {
  ok: boolean;
  motivo: string | null;
  request_person_id: string | null;
  person_id: string | null;
  cedula: string | null;
  nombre: string | null;
  apellido: string | null;
  foto_url: string | null;
  company_razon_social: string | null;
  activity_nombre: string | null;
  area_nombre: string | null;
  fecha_desde: string | null;
  fecha_hasta: string | null;
  horario_inicio: string | null;
  horario_fin: string | null;
  ultimo_evento: string | null;
  event_id: string | null;
};

export function CheckUI() {
  const [lookup, setLookup] = useState('');
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [preview, setPreview] = useState<RpcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function getPorteriaId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(PORTERIA_STORAGE_KEY);
  }

  async function verify() {
    const porteriaId = getPorteriaId();
    if (!porteriaId) {
      setError('No hay portería seleccionada. Ve a /dashboard/porteria y elige una portería.');
      return;
    }
    const val = lookup.trim();
    if (!val) return;

    setLoading(true);
    setPreview(null);
    setRegistered(false);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await (supabase as any).rpc('porteria_validate_and_log', {
      p_lookup_value: val,
      p_lookup_type: 'cedula',
      p_porteria_id: porteriaId,
      p_tipo: tipo,
      p_dry_run: true,
    });

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message ?? 'Error al verificar');
      return;
    }

    const result = (Array.isArray(data) ? data[0] : data) as RpcResult;
    setPreview(result);
  }

  async function register() {
    const porteriaId = getPorteriaId();
    if (!porteriaId || !preview) return;

    setRegistering(true);
    setError(null);

    const supabase = createClient();
    const { error: rpcError } = await (supabase as any).rpc('porteria_validate_and_log', {
      p_lookup_value: lookup.trim(),
      p_lookup_type: 'cedula',
      p_porteria_id: porteriaId,
      p_tipo: tipo,
      p_dry_run: false,
    });

    setRegistering(false);

    if (rpcError) {
      setError(rpcError.message ?? 'Error al registrar');
      return;
    }

    setRegistered(true);
    setPreview(null);
    setLookup('');
    inputRef.current?.focus();
  }

  function reset() {
    setPreview(null);
    setRegistered(false);
    setError(null);
    setLookup('');
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Validar acceso</h1>

      {/* Input section */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-3 flex gap-2">
          <button
            onClick={() => setTipo('entrada')}
            className={`rounded px-3 py-1 text-sm font-medium ${tipo === 'entrada' ? 'bg-green-600 text-white' : 'border border-green-600 text-green-600'}`}
          >
            Entrada
          </button>
          <button
            onClick={() => setTipo('salida')}
            className={`rounded px-3 py-1 text-sm font-medium ${tipo === 'salida' ? 'bg-orange-500 text-white' : 'border border-orange-500 text-orange-500'}`}
          >
            Salida
          </button>
        </div>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && verify()}
            placeholder="Cédula o código QR"
            className="flex-1 rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={verify}
            disabled={loading || !lookup.trim()}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verificando…' : `Verificar para ${tipo}`}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
          {error.includes('portería') && (
            <a href="/dashboard/porteria" className="ml-2 underline">
              Ir a Portería
            </a>
          )}
        </div>
      )}

      {/* Success registered banner */}
      {registered && (
        <div className="rounded border border-green-300 bg-green-50 p-4 text-center">
          <p className="text-lg font-semibold text-green-800">
            {tipo === 'entrada' ? 'Entrada registrada' : 'Salida registrada'}
          </p>
          <button onClick={reset} className="mt-2 text-sm text-green-700 underline">
            Nueva consulta
          </button>
        </div>
      )}

      {/* Preview card */}
      {preview && (
        <div
          className={`rounded-lg border-2 p-4 shadow ${preview.ok ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
        >
          {preview.ok ? (
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                {preview.foto_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview.foto_url}
                    alt="foto"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-xl font-bold text-green-800">
                    {preview.nombre} {preview.apellido}
                  </p>
                  <p className="text-sm text-green-700">CI: {preview.cedula}</p>
                  {preview.company_razon_social && (
                    <p className="text-sm text-gray-600">{preview.company_razon_social}</p>
                  )}
                  {preview.activity_nombre && (
                    <p className="text-sm text-gray-600">Actividad: {preview.activity_nombre}</p>
                  )}
                  {preview.area_nombre && (
                    <p className="text-sm text-gray-600">Área: {preview.area_nombre}</p>
                  )}
                  {preview.fecha_desde && preview.fecha_hasta && (
                    <p className="text-sm text-gray-600">
                      Vigencia: {preview.fecha_desde} → {preview.fecha_hasta}
                    </p>
                  )}
                  {preview.horario_inicio && preview.horario_fin && (
                    <p className="text-sm text-gray-600">
                      Horario: {preview.horario_inicio} – {preview.horario_fin}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={register}
                  disabled={registering}
                  className={`rounded px-4 py-2 font-medium text-white disabled:opacity-50 ${tipo === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}`}
                >
                  {registering
                    ? 'Registrando…'
                    : `Registrar ${tipo === 'entrada' ? 'ENTRADA' : 'SALIDA'}`}
                </button>
                <button onClick={reset} className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-semibold text-red-800">Acceso denegado</p>
              <p className="text-sm text-red-700">
                {preview.motivo
                  ? (motivoMap[preview.motivo] ?? preview.motivo)
                  : 'Sin motivo especificado'}
              </p>
              <button onClick={reset} className="mt-2 text-sm text-red-600 underline">
                Nueva consulta
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
