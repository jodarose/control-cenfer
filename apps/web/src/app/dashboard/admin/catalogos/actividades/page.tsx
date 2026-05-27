import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { ActivityForm } from './ActivityForm';

export default async function ActividadesPage() {
  await requireRole(['super_admin']);
  const supabase = createClient();
  const { data: activities } = await supabase
    .from('activities')
    .select('id, nombre, nivel_riesgo_default, documentos_requeridos, activa')
    .order('nombre');

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Actividades</h1>
      <ActivityForm />
      <table className="w-full border bg-white">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-sm">
            <th className="p-2">Nombre</th>
            <th className="p-2">Riesgo</th>
            <th className="p-2">Documentos</th>
            <th className="p-2">Activa</th>
          </tr>
        </thead>
        <tbody>
          {activities?.map((a) => (
            <tr key={a.id} className="border-b text-sm">
              <td className="p-2">{a.nombre}</td>
              <td className="p-2">{a.nivel_riesgo_default}</td>
              <td className="p-2">{a.documentos_requeridos?.join(', ')}</td>
              <td className="p-2">{a.activa ? 'Sí' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
