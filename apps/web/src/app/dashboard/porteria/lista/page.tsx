import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';

export default async function ListaPage() {
  await requireRole(['super_admin', 'sst', 'recepcion', 'portero']);
  const supabase = createClient();

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('request_people')
    .select(`
      id, estado_individual, qr_expires_at,
      person:people(cedula, nombre, apellido),
      access_request:access_requests!inner(fecha_desde, fecha_hasta, estado, horario_inicio, horario_fin,
        company:companies(razon_social),
        activity:activities(nombre)
      )
    `)
    .eq('estado_individual', 'aprobada')
    .in('access_request.estado', ['aprobada', 'vigente'])
    .lte('access_request.fecha_desde', today)
    .gte('access_request.fecha_hasta', today);

  const rows = (data ?? []) as any[];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Lista del día — {today}</h1>
      {error && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          Error al cargar: {error.message}
        </div>
      )}
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No hay personas autorizadas para hoy.</p>
      ) : (
        <div className="overflow-x-auto rounded border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Cédula</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Empresa</th>
                <th className="px-3 py-2 text-left">Actividad</th>
                <th className="px-3 py-2 text-left">Horario</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => {
                const person = row.person as { cedula: string; nombre: string; apellido: string } | null;
                const ar = row.access_request as {
                  horario_inicio: string | null;
                  horario_fin: string | null;
                  company: { razon_social: string } | null;
                  activity: { nombre: string } | null;
                } | null;
                return (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono">{person?.cedula ?? '—'}</td>
                    <td className="px-3 py-2">
                      {person ? `${person.nombre} ${person.apellido}` : '—'}
                    </td>
                    <td className="px-3 py-2">{(ar?.company as any)?.razon_social ?? '—'}</td>
                    <td className="px-3 py-2">{(ar?.activity as any)?.nombre ?? '—'}</td>
                    <td className="px-3 py-2">
                      {ar?.horario_inicio && ar?.horario_fin
                        ? `${ar.horario_inicio} – ${ar.horario_fin}`
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="p-2 text-right text-xs text-gray-400">{rows.length} personas</p>
        </div>
      )}
    </div>
  );
}
