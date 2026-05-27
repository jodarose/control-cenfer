import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

type Row = {
  request_person_id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  razon_social: string;
  ultima_entrada: string;
};

export default async function NoSalieronPage() {
  await requireRole(['super_admin', 'sst', 'recepcion']);
  const supabase = createClient();
  const { data } = await (supabase as any)
    .from('v_no_salieron_hoy')
    .select('*')
    .order('ultima_entrada', { ascending: true });

  const rows = (data ?? []) as Row[];

  return (
    <div>
      <Link href="/dashboard/reportes" className="text-sm text-blue-600 hover:underline">← Reportes</Link>
      <h1 className="mb-3 mt-2 text-2xl font-bold">No salieron hoy</h1>
      <p className="mb-3 text-sm text-gray-600">{rows.length} persona(s) entraron y aún no han registrado salida.</p>
      <table className="w-full border bg-white text-sm">
        <thead className="border-b bg-gray-50 text-left">
          <tr>
            <th className="p-2">Cédula</th>
            <th className="p-2">Persona</th>
            <th className="p-2">Empresa</th>
            <th className="p-2">Última entrada</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.request_person_id} className="border-b">
              <td className="p-2">{r.cedula}</td>
              <td className="p-2">{r.nombre} {r.apellido}</td>
              <td className="p-2">{r.razon_social}</td>
              <td className="p-2">{new Date(r.ultima_entrada).toLocaleString()}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="p-2 text-gray-500">Todos registraron salida.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
