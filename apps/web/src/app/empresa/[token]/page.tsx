import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase/public-client';
import { PortalEmpresa } from './PortalEmpresa';

export default async function EmpresaPortalPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createPublicClient();
  const { data: rows } = await (supabase as any).rpc('public_get_request_full', {
    p_token: params.token,
  });
  const req = rows?.[0];
  if (!req) notFound();
  return <PortalEmpresa token={params.token} request={req} />;
}
