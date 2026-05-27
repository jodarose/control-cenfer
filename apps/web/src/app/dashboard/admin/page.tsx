import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';

export default async function AdminPage() {
  await requireRole(['super_admin']);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Administración</h1>
      <ul className="space-y-2">
        <li><Link className="text-blue-600 hover:underline" href="/dashboard/admin/catalogos">Catálogos</Link></li>
      </ul>
    </div>
  );
}
