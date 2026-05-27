import Link from 'next/link';
import { getAuthenticatedUser } from '@/lib/auth/get-user';

export default async function DashboardPage() {
  const { profile } = await getAuthenticatedUser();
  const canSeeEmpresas = ['super_admin', 'recepcion', 'sst'].includes(profile.rol);
  const canSeeSolicitudes = ['super_admin', 'recepcion', 'sst', 'empresa'].includes(profile.rol);
  const canSeeSstBandeja = ['super_admin', 'sst'].includes(profile.rol);
  const canSeePorteria = ['super_admin', 'sst', 'recepcion', 'portero'].includes(profile.rol);
  const canSeeReportes = ['super_admin', 'sst', 'recepcion'].includes(profile.rol);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Bienvenido, {profile.nombre}</h1>
      <p className="text-gray-600">
        Tu rol: <strong>{profile.rol}</strong>
      </p>
      <div className="mt-6 space-y-2">
        {profile.rol === 'super_admin' && (
          <Link className="block text-blue-600 hover:underline" href="/dashboard/admin">
            → Administración
          </Link>
        )}
        {canSeeEmpresas && (
          <Link className="block text-blue-600 hover:underline" href="/dashboard/empresas">
            → Empresas contratistas
          </Link>
        )}
        {canSeeSolicitudes && (
          <Link className="block text-blue-600 hover:underline" href="/dashboard/solicitudes">
            → Solicitudes de acceso
          </Link>
        )}
        {canSeePorteria && (
          <Link className="block text-blue-600 hover:underline" href="/dashboard/porteria">
            → Portería
          </Link>
        )}
        {canSeeSstBandeja && (
          <Link className="block text-blue-600 hover:underline" href="/dashboard/sst/bandeja">
            → Bandeja SST
          </Link>
        )}
        {canSeeReportes && (
          <Link className="block text-blue-600 hover:underline" href="/dashboard/reportes">
            → Reportes
          </Link>
        )}
      </div>
    </div>
  );
}
