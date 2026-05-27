import { requireRole } from '@/lib/auth/require-role';
import { RequestForm } from './RequestForm';

export default async function NuevaSolicitudPage() {
  await requireRole(['super_admin', 'recepcion']);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Nueva solicitud de acceso</h1>
      <RequestForm />
    </div>
  );
}
