import { getAuthenticatedUser } from '@/lib/auth/get-user';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getAuthenticatedUser();
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Control Cenfer</span>
          <span className="text-sm text-gray-600">
            {profile.nombre} {profile.apellido} · {profile.rol}
          </span>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
