import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

const ESTADO_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada a empresa',
  en_carga: 'En carga',
  en_revision_sst: 'En revisión SST',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  vigente: 'Vigente',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
};

export default async function SolicitudDetailPage({ params }: { params: { id: string } }) {
  await requireRole(['super_admin', 'recepcion', 'sst', 'empresa']);
  const supabase = createClient();
  const { data: s } = await supabase
    .from('access_requests')
    .select(`
      id, fecha_desde, fecha_hasta, horario_inicio, horario_fin, estado,
      cantidad_estimada, nivel_riesgo, observaciones,
      public_token, public_token_expires_at,
      companies(razon_social, contacto_email, contacto_nombre),
      activities(nombre, documentos_requeridos),
      areas(nombre)
    `)
    .eq('id', params.id)
    .maybeSingle();

  if (!s) notFound();

  const company = s.companies as { razon_social: string; contacto_email: string; contacto_nombre: string } | null;
  const activity = s.activities as { nombre: string; documentos_requeridos: string[] } | null;
  const area = s.areas as { nombre: string } | null;

  const publicLink = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/empresa/${s.public_token}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/solicitudes" className="text-sm text-blue-600 hover:underline">← Volver a solicitudes</Link>
        <h1 className="mt-2 text-2xl font-bold">Solicitud de acceso</h1>
        <p className="text-sm text-gray-600">{ESTADO_LABEL[s.estado] ?? s.estado}</p>
      </div>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-2 font-semibold">Datos de la solicitud</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-gray-500">Empresa</dt>
          <dd>{company?.razon_social}</dd>
          <dt className="text-gray-500">Contacto</dt>
          <dd>{company?.contacto_nombre} ({company?.contacto_email})</dd>
          <dt className="text-gray-500">Actividad</dt>
          <dd>{activity?.nombre}</dd>
          <dt className="text-gray-500">Área</dt>
          <dd>{area?.nombre ?? '—'}</dd>
          <dt className="text-gray-500">Fechas</dt>
          <dd>{s.fecha_desde} → {s.fecha_hasta}</dd>
          <dt className="text-gray-500">Horario</dt>
          <dd>{s.horario_inicio} – {s.horario_fin}</dd>
          <dt className="text-gray-500">Nivel de riesgo</dt>
          <dd>{s.nivel_riesgo}</dd>
          <dt className="text-gray-500">Cantidad estimada</dt>
          <dd>{s.cantidad_estimada}</dd>
          <dt className="text-gray-500">Documentos requeridos</dt>
          <dd>{activity?.documentos_requeridos?.join(', ')}</dd>
          {s.observaciones && (
            <>
              <dt className="text-gray-500">Observaciones</dt>
              <dd>{s.observaciones}</dd>
            </>
          )}
        </dl>
      </section>

      <section className="rounded border bg-blue-50 p-4">
        <h2 className="mb-2 font-semibold">Link público para la empresa</h2>
        <p className="mb-2 text-sm text-gray-700">
          Envía este link al contacto de la empresa para que cargue su personal y documentos.
          Válido hasta: <strong>{s.public_token_expires_at ? new Date(s.public_token_expires_at).toLocaleString() : '—'}</strong>
        </p>
        <code className="block break-all rounded bg-white p-2 text-sm">{publicLink}</code>
        <p className="mt-2 text-xs text-gray-500">
          (Envío automático por email se habilita cuando el sistema de notificaciones esté activo. Por ahora copia y envía manualmente.)
        </p>
      </section>
    </div>
  );
}
