import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Control Cenfer',
  description: 'Sistema de control de acceso al recinto ferial Cenfer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
