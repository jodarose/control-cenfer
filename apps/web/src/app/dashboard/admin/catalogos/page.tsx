import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';

export default async function CatalogosPage() {
  await requireRole(['super_admin']);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Catálogos</h1>
      <ul className="space-y-2">
        <li><Link className="text-blue-600 hover:underline" href="/dashboard/admin/catalogos/actividades">Actividades</Link></li>
        <li><Link className="text-blue-600 hover:underline" href="/dashboard/admin/catalogos/areas">Áreas</Link></li>
        <li><Link className="text-blue-600 hover:underline" href="/dashboard/admin/catalogos/porterias">Porterías</Link></li>
      </ul>
    </div>
  );
}
