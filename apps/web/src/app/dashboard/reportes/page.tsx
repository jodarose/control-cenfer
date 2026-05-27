import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';

const REPORTS = [
  { href: '/dashboard/reportes/vencimientos', title: 'Documentos por vencer', desc: 'Vence en ≤ 30 días o ya vencido.' },
  { href: '/dashboard/reportes/no-salieron', title: 'No salieron hoy', desc: 'Personas que entraron y no han salido.' },
  { href: '/dashboard/reportes/historial', title: 'Historial de eventos', desc: 'Ingresos y salidas con filtros.' },
  { href: '/dashboard/reportes/empresas', title: 'Dashboard empresas', desc: 'Métricas por empresa contratista.' },
  { href: '/dashboard/reportes/actividades', title: 'Dashboard actividades', desc: 'Métricas por tipo de actividad.' },
];

export default async function ReportesIndexPage() {
  await requireRole(['super_admin', 'sst', 'recepcion']);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Reportes</h1>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Link key={r.href} href={r.href} className="block rounded-lg border bg-white p-4 shadow-sm hover:border-blue-500">
            <h2 className="font-semibold">{r.title}</h2>
            <p className="text-sm text-gray-600">{r.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
