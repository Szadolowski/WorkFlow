import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/api-client";
import Sidebar from "@/components/layout/Sidebar";
import { logoutAction } from "@/app/actions/auth.actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;

  try {
    // Automatycznie dokleja cookie z JWT
    const res = await serverFetch("/auth/me");
    const data = await res.json();
    user = data.user;
  } catch {
    redirect("/login");
  }

  // Wczesne wyjście dla braku sesji
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <Sidebar role={user.role} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Górny pasek */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0">
          <div className="text-sm text-slate-500">
            Zalogowano jako:{" "}
            <span className="font-semibold text-slate-900">
              {user.firstName} {user.lastName}
            </span>{" "}
            ({user.role})
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              Wyloguj się
            </button>
          </form>
        </header>

        {/* Główna zawartość podstron (np. nasza tabela pracowników) */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
