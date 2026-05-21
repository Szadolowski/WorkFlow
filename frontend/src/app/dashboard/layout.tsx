import { redirect } from "next/navigation";

import { logoutAction } from "@/app/actions/auth.actions";
import Sidebar from "@/components/layout/Sidebar";
import { serverFetch } from "@/lib/api-client";
import FacilityProvider from "@/providers/FacilityProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;

  try {
    const res = await serverFetch("/auth/me");
    const data = await res.json();
    user = data.user;
  } catch {
    redirect("/login");
  }

  if (!user) redirect("/login");

  return (
    <FacilityProvider
      facilities={user.facilities}
      initialActiveFacilityId={user.activeFacilityId}
    >
      <div className="flex h-screen w-full overflow-hidden bg-slate-50">
        <Sidebar role={user.role} />

        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-8">
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
                className="text-sm font-medium text-red-600 transition-colors hover:text-red-700"
              >
                Wyloguj się
              </button>
            </form>
          </header>

          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </div>
    </FacilityProvider>
  );
}
