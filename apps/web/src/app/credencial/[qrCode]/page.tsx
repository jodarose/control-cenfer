import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase/public-client';
import { CredencialCard } from './CredencialCard';

export const dynamic = 'force-dynamic';

export default async function CredencialPage({ params }: { params: { qrCode: string } }) {
  const supabase = createPublicClient();
  // get_credencial_by_qr is not yet in generated types — use unknown cast
  const client = supabase as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown[] | null }>;
  };
  const { data } = await client.rpc('get_credencial_by_qr', { p_qr_code: params.qrCode });
  const cred = data?.[0];
  if (!cred) notFound();
  return <CredencialCard qrCode={params.qrCode} credencial={cred as never} />;
}
