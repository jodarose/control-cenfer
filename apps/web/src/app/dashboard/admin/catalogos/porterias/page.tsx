import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { PorteriaForm } from './PorteriaForm';

export default async function PorteriasPage() {
  await requireRole(['super_admin']);
  const supabase = createClient();
  const { data: porterias } = await supabase
    .from('porterias')
    .select('id, nombre, ubicacion, activa')
    .order('nombre');

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Porterías</h1>
      <PorteriaForm />
      <table className="w-full border bg-white">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-sm">
            <th className="p-2">Nombre</th>
            <th className="p-2">Ubicación</th>
            <th className="p-2">Activa</th>
          </tr>
        </thead>
        <tbody>
          {porterias?.map((p) => (
            <tr key={p.id} className="border-b text-sm">
              <td className="p-2">{p.nombre}</td>
              <td className="p-2">{p.ubicacion ?? '—'}</td>
              <td className="p-2">{p.activa ? 'Sí' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
