import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

type Row = {
  company_id: string;
  razon_social: string;
  nit: string;
  total_solicitudes: number;
  solicitudes_vigentes: number;
  personas_aprobadas: number;
  personas_rechazadas: number;
};

export default async function EmpresasReportPage() {
  await requireRole(['super_admin', 'sst', 'recepcion']);
  const supabase = createClient();
  const { data } = await (supabase as any)
    .from('v_dashboard_empresas')
    .select('*')
    .order('total_solicitudes', { ascending: false });

  const rows = (data ?? []) as Row[];

  return (
    <div>
      <Link href="/dashboard/reportes" className="text-sm text-blue-600 hover:underline">← Reportes</Link>
      <h1 className="mb-3 mt-2 text-2xl font-bold">Dashboard empresas</h1>
      <p className="mb-3 text-sm text-gray-600">{rows.length} empresa(s)</p>
      <table className="w-full border bg-white text-sm">
        <thead className="border-b bg-gray-50 text-left">
          <tr>
            <th className="p-2">NIT</th>
            <th className="p-2">Empresa</th>
            <th className="p-2">Solicitudes</th>
            <th className="p-2">Vigentes</th>
            <th className="p-2">Personas aprobadas</th>
            <th className="p-2">Rechazadas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.company_id} className="border-b">
              <td className="p-2">{r.nit}</td>
              <td className="p-2">{r.razon_social}</td>
              <td className="p-2">{r.total_solicitudes}</td>
              <td className="p-2">{r.solicitudes_vigentes}</td>
              <td className="p-2">{r.personas_aprobadas}</td>
              <td className="p-2 text-red-600">{r.personas_rechazadas}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="p-2 text-gray-500">Sin datos.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
