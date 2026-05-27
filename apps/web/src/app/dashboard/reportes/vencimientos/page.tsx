import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  razon_social: string;
  document_type: string;
  fecha_vencimiento: string;
  dias_restantes: number;
  estado: string;
};

function rowClass(d: number) {
  if (d < 0) return 'bg-red-50';
  if (d < 8) return 'bg-amber-50';
  return '';
}

export default async function VencimientosPage() {
  await requireRole(['super_admin', 'sst', 'recepcion']);
  const supabase = createClient();
  const { data } = await (supabase as any)
    .from('v_documentos_por_vencer')
    .select('*')
    .order('dias_restantes', { ascending: true });

  const rows = (data ?? []) as Row[];

  return (
    <div>
      <Link href="/dashboard/reportes" className="text-sm text-blue-600 hover:underline">← Reportes</Link>
      <h1 className="mb-3 mt-2 text-2xl font-bold">Documentos por vencer</h1>
      <p className="mb-3 text-sm text-gray-600">{rows.length} documento(s) vencen en los próximos 30 días o ya vencieron.</p>
      <table className="w-full border bg-white text-sm">
        <thead className="border-b bg-gray-50 text-left">
          <tr>
            <th className="p-2">Cédula</th>
            <th className="p-2">Persona</th>
            <th className="p-2">Empresa</th>
            <th className="p-2">Documento</th>
            <th className="p-2">Vence</th>
            <th className="p-2">Días</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={`border-b ${rowClass(r.dias_restantes)}`}>
              <td className="p-2">{r.cedula}</td>
              <td className="p-2">{r.nombre} {r.apellido}</td>
              <td className="p-2">{r.razon_social}</td>
              <td className="p-2">{r.document_type}</td>
              <td className="p-2">{r.fecha_vencimiento}</td>
              <td className="p-2">
                {r.dias_restantes < 0
                  ? `Vencido hace ${-r.dias_restantes}`
                  : `En ${r.dias_restantes}`}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="p-2 text-gray-500">Sin documentos por vencer.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
