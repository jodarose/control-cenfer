import { requireRole } from '@/lib/auth/require-role';
import { CheckUI } from './CheckUI';

export default async function CheckPage() {
  await requireRole(['super_admin', 'sst', 'recepcion', 'portero']);
  return <CheckUI />;
}
