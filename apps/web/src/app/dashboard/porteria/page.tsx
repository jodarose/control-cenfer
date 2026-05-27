import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { PorteriaSelector } from './PorteriaSelector';

export default async function PorteriaIndexPage() {
  await requireRole(['super_admin', 'sst', 'recepcion', 'portero']);
  const supabase = createClient();
  const { data: porterias } = await supabase
    .from('porterias')
    .select('id, nombre, ubicacion, activa')
    .eq('activa', true)
    .order('nombre');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Portería</h1>
      <PorteriaSelector porterias={porterias ?? []} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link
          href="/dashboard/porteria/check"
          className="block rounded-lg border bg-white p-6 text-center shadow-sm hover:border-blue-500"
        >
          <div className="mb-2 text-3xl">🔎</div>
          <h2 className="font-semibold">Validar acceso</h2>
          <p className="text-sm text-gray-600">Buscar por cédula o escanear QR</p>
        </Link>
        <Link
          href="/dashboard/porteria/lista"
          className="block rounded-lg border bg-white p-6 text-center shadow-sm hover:border-blue-500"
        >
          <div className="mb-2 text-3xl">📋</div>
          <h2 className="font-semibold">Lista del día</h2>
          <p className="text-sm text-gray-600">Personas autorizadas hoy</p>
        </Link>
        <Link
          href="/dashboard/porteria/dentro"
          className="block rounded-lg border bg-white p-6 text-center shadow-sm hover:border-blue-500"
        >
          <div className="mb-2 text-3xl">👥</div>
          <h2 className="font-semibold">Dentro ahora</h2>
          <p className="text-sm text-gray-600">Quiénes están adentro</p>
        </Link>
      </div>
    </div>
  );
}
