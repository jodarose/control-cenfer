import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export default async function BandejaSstPage() {
  await requireRole(['super_admin', 'sst']);
  const supabase = createClient();

  const { data: solicitudes } = await supabase
    .from('access_requests')
    .select(`
      id, fecha_desde, fecha_hasta, estado, cantidad_estimada,
      companies(razon_social),
      activities(nombre, nivel_riesgo_default),
      request_people(id, estado_individual)
    `)
    .eq('estado', 'en_revision_sst')
    .order('fecha_desde', { ascending: true });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Bandeja SST</h1>
      {(!solicitudes || solicitudes.length === 0) && (
        <p className="text-sm text-gray-500">No hay solicitudes pendientes de revisión.</p>
      )}
      <div className="space-y-3">
        {solicitudes?.map((s) => {
          const people = s.request_people ?? [];
          const pendientes = people.filter(
            (p: any) =>
              p.estado_individual === 'pendiente_docs' || p.estado_individual === 'en_revision',
          ).length;
          const aprobadas = people.filter(
            (p: any) => p.estado_individual === 'aprobada',
          ).length;
          const rechazadas = people.filter(
            (p: any) => p.estado_individual === 'rechazada',
          ).length;
          const company = s.companies as { razon_social: string } | null;
          const activity = s.activities as {
            nombre: string;
            nivel_riesgo_default: string;
          } | null;
          return (
            <Link
              key={s.id}
              href={`/dashboard/sst/bandeja/${s.id}`}
              className="block rounded border bg-white p-4 hover:border-blue-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{company?.razon_social ?? '—'}</h2>
                  <p className="text-sm text-gray-600">
                    {activity?.nombre} · Riesgo {activity?.nivel_riesgo_default} ·{' '}
                    {s.fecha_desde} → {s.fecha_hasta}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>
                    {aprobadas} aprobadas · {pendientes} en revisión · {rechazadas} rechazadas
                  </p>
                  <p className="text-gray-500">{people.length} personas totales</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
