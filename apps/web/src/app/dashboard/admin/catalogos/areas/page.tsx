import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { AreaForm } from './AreaForm';

export default async function AreasPage() {
  await requireRole(['super_admin']);
  const supabase = createClient();
  const { data: areas } = await supabase
    .from('areas')
    .select('id, nombre, descripcion, activa')
    .order('nombre');

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Áreas</h1>
      <AreaForm />
      <table className="w-full border bg-white">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-sm">
            <th className="p-2">Nombre</th>
            <th className="p-2">Descripción</th>
            <th className="p-2">Activa</th>
          </tr>
        </thead>
        <tbody>
          {areas?.map((a) => (
            <tr key={a.id} className="border-b text-sm">
              <td className="p-2">{a.nombre}</td>
              <td className="p-2">{a.descripcion ?? '—'}</td>
              <td className="p-2">{a.activa ? 'Sí' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
