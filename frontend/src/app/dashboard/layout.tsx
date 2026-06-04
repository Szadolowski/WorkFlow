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

    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        `[DashboardLayout] Błąd API: Status ${res.status} | Odpowiedź:`,
        errorText,
      );
    } else {
      const data = await res.json();
      user = data.user;
    }
  } catch (error) {
    console.error(
      "[DashboardLayout] Wyjątek podczas pobierania użytkownika:",
      error,
    );
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <FacilityProvider
      facilities={user.facilities}
      initialActiveFacilityId={user.activeFacilityId}
      currentUser={{
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      }}
    >
      <div className="min-h-screen w-full bg-background md:flex">
        <Sidebar role={user.role} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 md:h-16 md:px-8 md:py-0">
            <div className="min-w-0 text-xs text-muted-foreground sm:text-sm">
              <span className="hidden sm:inline">Zalogowano jako: </span>
              <span className="font-semibold text-foreground">
                {user.firstName} {user.lastName}
              </span>{" "}
              <span className="whitespace-nowrap">({user.role})</span>
            </div>

            <form action={logoutAction} className="shrink-0">
              <button
                type="submit"
                className="text-xs font-medium text-red-600 transition-colors hover:text-red-700 sm:text-sm dark:text-destructive"
              >
                Wyloguj się
              </button>
            </form>
          </header>

          <main className="min-w-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </FacilityProvider>
  );
}
