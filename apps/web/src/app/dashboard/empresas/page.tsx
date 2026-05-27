import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export default async function EmpresasPage() {
  const { profile } = await requireRole(['super_admin', 'recepcion', 'sst']);
  const canCreate = profile.rol === 'super_admin' || profile.rol === 'recepcion';

  const supabase = createClient();
  const { data: companies } = await supabase
    .from('companies')
    .select('id, nit, razon_social, contacto_email, activa')
    .order('razon_social');

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Empresas contratistas</h1>
        {canCreate && (
          <Link
            href="/dashboard/empresas/nueva"
            className="rounded bg-blue-600 px-3 py-1.5 text-white"
          >
            Nueva empresa
          </Link>
        )}
      </div>
      <table className="w-full border bg-white text-sm">
        <thead className="border-b bg-gray-50 text-left">
          <tr>
            <th className="p-2">NIT</th>
            <th className="p-2">Razón social</th>
            <th className="p-2">Contacto</th>
            <th className="p-2">Activa</th>
          </tr>
        </thead>
        <tbody>
          {companies?.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-2">{c.nit}</td>
              <td className="p-2">{c.razon_social}</td>
              <td className="p-2">{c.contacto_email}</td>
              <td className="p-2">{c.activa ? 'Sí' : 'No'}</td>
            </tr>
          ))}
          {(!companies || companies.length === 0) && (
            <tr>
              <td className="p-2 text-gray-500" colSpan={4}>
                No hay empresas registradas todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
