import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';

export default async function DentroPage() {
  await requireRole(['super_admin', 'sst', 'recepcion', 'portero']);
  const supabase = createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: events, error } = await (supabase as any)
    .from('access_events')
    .select(`
      id, tipo, created_at, porteria_id, request_person_id,
      porteria:porterias(nombre),
      rp:request_people(
        person:people(cedula, nombre, apellido),
        access_request:access_requests(company:companies(razon_social))
      )
    `)
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false });

  const lastByRp = new Map<string, any>();
  for (const e of events ?? []) {
    if (!lastByRp.has(e.request_person_id)) lastByRp.set(e.request_person_id, e);
  }
  const dentro = Array.from(lastByRp.values()).filter((e) => e.tipo === 'entrada');

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Personas dentro ahora</h1>
      {error && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          Error al cargar: {error.message}
        </div>
      )}
      {dentro.length === 0 ? (
        <p className="text-sm text-gray-500">No hay personas dentro en este momento.</p>
      ) : (
        <div className="overflow-x-auto rounded border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Cédula</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Empresa</th>
                <th className="px-3 py-2 text-left">Portería</th>
                <th className="px-3 py-2 text-left">Hora entrada</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {dentro.map((e) => {
                const rp = e.rp as any;
                const person = rp?.person as { cedula: string; nombre: string; apellido: string } | null;
                const ar = rp?.access_request as any;
                const company = ar?.company as { razon_social: string } | null;
                const porteria = e.porteria as { nombre: string } | null;
                const hora = new Date(e.created_at).toLocaleTimeString('es-VE', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono">{person?.cedula ?? '—'}</td>
                    <td className="px-3 py-2">
                      {person ? `${person.nombre} ${person.apellido}` : '—'}
                    </td>
                    <td className="px-3 py-2">{company?.razon_social ?? '—'}</td>
                    <td className="px-3 py-2">{porteria?.nombre ?? '—'}</td>
                    <td className="px-3 py-2">{hora}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="p-2 text-right text-xs text-gray-400">{dentro.length} personas dentro</p>
        </div>
      )}
    </div>
  );
}
