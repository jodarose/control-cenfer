import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

type Row = {
  event_id: string;
  fecha_hora: string;
  tipo: 'entrada' | 'salida';
  cedula: string;
  nombre: string;
  apellido: string;
  razon_social: string;
  activity_nombre: string;
  porteria_nombre: string;
  metodo: 'cedula' | 'qr' | 'manual';
};

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: { desde?: string; hasta?: string; company?: string };
}) {
  await requireRole(['super_admin', 'sst', 'recepcion']);
  const supabase = createClient();

  const desde = searchParams.desde ?? daysAgo(7);
  const hasta = searchParams.hasta ?? today();
  const companyId = searchParams.company || null;

  const { data: companies } = await supabase
    .from('companies')
    .select('id, razon_social')
    .order('razon_social');

  const { data: events, error } = await (supabase as any).rpc('reporte_historial_eventos', {
    p_desde: desde,
    p_hasta: hasta,
    p_company_id: companyId,
  });

  const rows = (events ?? []) as Row[];

  return (
    <div>
      <Link href="/dashboard/reportes" className="text-sm text-blue-600 hover:underline">← Reportes</Link>
      <h1 className="mb-3 mt-2 text-2xl font-bold">Historial de eventos</h1>

      <form method="get" className="mb-4 flex flex-wrap gap-2 rounded border bg-white p-3 text-sm">
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">Desde</span>
          <input type="date" name="desde" defaultValue={desde} className="rounded border px-2 py-1" />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">Hasta</span>
          <input type="date" name="hasta" defaultValue={hasta} className="rounded border px-2 py-1" />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">Empresa</span>
          <select name="company" defaultValue={companyId ?? ''} className="rounded border px-2 py-1">
            <option value="">— todas —</option>
            {companies?.map((c) => (
              <option key={c.id} value={c.id}>{c.razon_social}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="self-end rounded bg-blue-600 px-3 py-1.5 text-white">
          Filtrar
        </button>
      </form>

      {error && <p className="mb-2 text-sm text-red-600">{(error as { message: string }).message}</p>}
      <p className="mb-2 text-sm text-gray-600">{rows.length} evento(s)</p>

      <table className="w-full border bg-white text-sm">
        <thead className="border-b bg-gray-50 text-left">
          <tr>
            <th className="p-2">Fecha/Hora</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Cédula</th>
            <th className="p-2">Persona</th>
            <th className="p-2">Empresa</th>
            <th className="p-2">Actividad</th>
            <th className="p-2">Portería</th>
            <th className="p-2">Método</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.event_id} className="border-b">
              <td className="p-2">{new Date(r.fecha_hora).toLocaleString()}</td>
              <td className="p-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    r.tipo === 'entrada'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {r.tipo}
                </span>
              </td>
              <td className="p-2">{r.cedula}</td>
              <td className="p-2">{r.nombre} {r.apellido}</td>
              <td className="p-2">{r.razon_social}</td>
              <td className="p-2">{r.activity_nombre}</td>
              <td className="p-2">{r.porteria_nombre}</td>
              <td className="p-2">{r.metodo}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="p-2 text-gray-500">Sin eventos en el rango seleccionado.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
