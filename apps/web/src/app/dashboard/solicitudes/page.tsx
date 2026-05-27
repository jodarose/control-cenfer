import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

const ESTADO_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada a empresa',
  en_carga: 'En carga',
  en_revision_sst: 'En revisión SST',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  vigente: 'Vigente',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
};

export default async function SolicitudesPage() {
  const { profile } = await requireRole(['super_admin', 'recepcion', 'sst', 'empresa']);
  const canCreate = profile.rol === 'super_admin' || profile.rol === 'recepcion';

  const supabase = createClient();
  const { data: solicitudes } = await supabase
    .from('access_requests')
    .select('id, fecha_desde, fecha_hasta, estado, cantidad_estimada, companies(razon_social), activities(nombre)')
    .order('fecha_desde', { ascending: false });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Solicitudes de acceso</h1>
        {canCreate && (
          <Link href="/dashboard/solicitudes/nueva" className="rounded bg-blue-600 px-3 py-1.5 text-white">
            Nueva solicitud
          </Link>
        )}
      </div>
      <table className="w-full border bg-white text-sm">
        <thead className="border-b bg-gray-50 text-left">
          <tr>
            <th className="p-2">Empresa</th>
            <th className="p-2">Actividad</th>
            <th className="p-2">Fechas</th>
            <th className="p-2">Personas</th>
            <th className="p-2">Estado</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {solicitudes?.map((s) => (
            <tr key={s.id} className="border-b">
              <td className="p-2">{(s.companies as { razon_social: string } | null)?.razon_social ?? '—'}</td>
              <td className="p-2">{(s.activities as { nombre: string } | null)?.nombre ?? '—'}</td>
              <td className="p-2">{s.fecha_desde} → {s.fecha_hasta}</td>
              <td className="p-2">{s.cantidad_estimada}</td>
              <td className="p-2">{ESTADO_LABEL[s.estado] ?? s.estado}</td>
              <td className="p-2"><Link href={`/dashboard/solicitudes/${s.id}`} className="text-blue-600 hover:underline">Ver →</Link></td>
            </tr>
          ))}
          {(!solicitudes || solicitudes.length === 0) && (
            <tr><td colSpan={6} className="p-2 text-gray-500">No hay solicitudes todavía.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
