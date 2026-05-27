import { requireRole } from '@/lib/auth/require-role';
import { CompanyForm } from '../CompanyForm';

export default async function NuevaEmpresaPage() {
  await requireRole(['super_admin', 'recepcion']);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Nueva empresa</h1>
      <CompanyForm />
    </div>
  );
}
