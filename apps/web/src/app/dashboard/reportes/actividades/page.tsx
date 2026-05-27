import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

type Row = {
  activity_id: string;
  nombre: string;
  nivel_riesgo_default: string;
  total_solicitudes: number;
  solicitudes_vigentes: number;
  personas_unicas: number;
  personas_aprobadas: number;
};

export default async function ActividadesReportPage() {
  await requireRole(['super_admin', 'sst', 'recepcion']);
  const supabase = createClient();
  const { data } = await (supabase as any)
    .from('v_dashboard_actividades')
    .select('*')
    .order('total_solicitudes', { ascending: false });

  const rows = (data ?? []) as Row[];

  return (
    <div>
      <Link href="/dashboard/reportes" className="text-sm text-blue-600 hover:underline">← Reportes</Link>
      <h1 className="mb-3 mt-2 text-2xl font-bold">Dashboard actividades</h1>
      <p className="mb-3 text-sm text-gray-600">{rows.length} actividad(es)</p>
      <table className="w-full border bg-white text-sm">
        <thead className="border-b bg-gray-50 text-left">
          <tr>
            <th className="p-2">Actividad</th>
            <th className="p-2">Nivel de riesgo</th>
            <th className="p-2">Solicitudes</th>
            <th className="p-2">Vigentes</th>
            <th className="p-2">Personas únicas</th>
            <th className="p-2">Aprobadas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.activity_id} className="border-b">
              <td className="p-2">{r.nombre}</td>
              <td className="p-2">{r.nivel_riesgo_default}</td>
              <td className="p-2">{r.total_solicitudes}</td>
              <td className="p-2">{r.solicitudes_vigentes}</td>
              <td className="p-2">{r.personas_unicas}</td>
              <td className="p-2">{r.personas_aprobadas}</td>
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
