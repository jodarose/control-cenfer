'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

type Credencial = {
  request_person_id: string;
  person_id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  foto_url: string | null;
  company_razon_social: string;
  activity_nombre: string;
  area_nombre: string | null;
  fecha_desde: string;
  fecha_hasta: string;
  horario_inicio: string;
  horario_fin: string;
  qr_expires_at: string | null;
  estado_solicitud: string;
  estado_individual: string;
};

export function CredencialCard({ qrCode, credencial }: { qrCode: string; credencial: Credencial }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, qrCode, { width: 240, margin: 1 }, (err) => {
      if (err) console.error(err);
    });
  }, [qrCode]);

  const now = new Date();
  const expires = credencial.qr_expires_at ? new Date(credencial.qr_expires_at) : null;
  const isExpired = expires ? expires < now : false;
  const isApproved =
    credencial.estado_individual === 'aprobada' &&
    (credencial.estado_solicitud === 'aprobada' || credencial.estado_solicitud === 'vigente') &&
    !isExpired;

  const ringColor = isApproved ? 'border-green-500' : 'border-red-500';
  const statusText = isApproved ? 'VIGENTE' : isExpired ? 'VENCIDA' : 'NO AUTORIZADA';
  const statusColor = isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className={`w-full max-w-sm rounded-2xl border-4 bg-white shadow-lg ${ringColor}`}>
        <div className="border-b bg-gray-50 px-4 py-3">
          <h1 className="text-center text-lg font-bold">Control Cenfer</h1>
          <p className="text-center text-xs text-gray-500">Credencial digital de acceso</p>
        </div>

        <div className="flex flex-col items-center gap-3 p-4">
          <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-gray-200 bg-gray-100">
            {credencial.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={credencial.foto_url} alt={credencial.nombre} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">Sin foto</div>
            )}
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold">{credencial.nombre} {credencial.apellido}</h2>
            <p className="text-sm text-gray-600">CC {credencial.cedula}</p>
          </div>

          <span className={`rounded px-3 py-1 text-sm font-semibold ${statusColor}`}>
            {statusText}
          </span>

          <dl className="w-full space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Empresa</dt><dd className="font-medium">{credencial.company_razon_social}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Actividad</dt><dd className="font-medium">{credencial.activity_nombre}</dd></div>
            {credencial.area_nombre && (
              <div className="flex justify-between"><dt className="text-gray-500">Área</dt><dd className="font-medium">{credencial.area_nombre}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-gray-500">Vigencia</dt><dd className="font-medium">{credencial.fecha_desde} → {credencial.fecha_hasta}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Horario</dt><dd className="font-medium">{credencial.horario_inicio} – {credencial.horario_fin}</dd></div>
          </dl>

          <div className="border-t pt-3">
            <canvas ref={canvasRef} className="block" />
            <p className="mt-1 text-center text-xs text-gray-500">Muestra este QR en portería</p>
          </div>
        </div>
      </div>
    </main>
  );
}
