import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { PersonReview } from './PersonReview';
import { RequestActions } from './RequestActions';

export default async function BandejaSstDetailPage({ params }: { params: { id: string } }) {
  await requireRole(['super_admin', 'sst']);
  const supabase = createClient();

  const { data: s } = await supabase
    .from('access_requests')
    .select(`
      id, fecha_desde, fecha_hasta, horario_inicio, horario_fin,
      estado, cantidad_estimada, nivel_riesgo, observaciones,
      companies(razon_social, contacto_nombre, contacto_email),
      activities(nombre, documentos_requeridos),
      areas(nombre)
    `)
    .eq('id', params.id)
    .maybeSingle();

  if (!s) notFound();

  const { data: people } = await supabase
    .from('request_people')
    .select(`
      id, estado_individual,
      person:people(id, cedula, nombre, apellido, foto_url,
        documents:person_documents(id, document_type, archivo_url, estado, fecha_emision, fecha_vencimiento, motivo_rechazo)
      )
    `)
    .eq('access_request_id', params.id);

  const company = s.companies as {
    razon_social: string;
    contacto_nombre: string;
    contacto_email: string;
  } | null;
  const activity = s.activities as {
    nombre: string;
    documentos_requeridos: string[];
  } | null;
  const area = s.areas as { nombre: string } | null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/sst/bandeja" className="text-sm text-blue-600 hover:underline">
          ← Volver a la bandeja
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{company?.razon_social}</h1>
        <p className="text-sm text-gray-600">
          {activity?.nombre} · {area?.nombre ?? 'Sin área'} · {s.fecha_desde} → {s.fecha_hasta} ·
          Riesgo {s.nivel_riesgo}
        </p>
      </div>

      <section className="rounded border bg-blue-50 p-4 text-sm">
        <h2 className="mb-1 font-semibold">Documentos requeridos por persona</h2>
        <ul className="list-disc pl-5">
          {activity?.documentos_requeridos?.map((d) => <li key={d}>{d}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Personal a revisar ({people?.length ?? 0})
        </h2>
        <div className="space-y-3">
          {people?.map((rp) => (
            <PersonReview
              key={rp.id}
              requestPersonId={rp.id}
              estadoIndividual={rp.estado_individual as any}
              person={rp.person as any}
              documentosRequeridos={(activity?.documentos_requeridos ?? []) as any}
            />
          ))}
        </div>
      </section>

      <RequestActions requestId={s.id} />
    </div>
  );
}
