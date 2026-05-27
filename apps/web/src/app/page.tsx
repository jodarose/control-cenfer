import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Control Cenfer</h1>
      <p className="text-gray-600">Sistema de control de acceso al recinto ferial.</p>
      <Link href="/login" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Iniciar sesión
      </Link>
    </main>
  );
}
