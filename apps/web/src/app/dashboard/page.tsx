import Link from 'next/link';
import { getAuthenticatedUser } from '@/lib/auth/get-user';

export default async function DashboardPage() {
  const { profile } = await getAuthenticatedUser();
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Bienvenido, {profile.nombre}</h1>
      <p className="text-gray-600">
        Tu rol: <strong>{profile.rol}</strong>
      </p>
      {profile.rol === 'super_admin' && (
        <div className="mt-6 space-y-2">
          <Link className="block text-blue-600 hover:underline" href="/dashboard/admin">
            → Administración
          </Link>
        </div>
      )}
      <p className="mt-4 text-sm text-gray-500">
        Las funcionalidades específicas por rol se construyen en las siguientes fases.
      </p>
    </div>
  );
}
