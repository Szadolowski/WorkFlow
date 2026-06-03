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
    // Od teraz wiemy DOKŁADNIE, jeśli fetch rzuci jakimś błędem (np. brak sieci, 401 z api-client)
    console.error(
      "[DashboardLayout] Wyjątek podczas pobierania użytkownika:",
      error,
    );
  }

  // Wyrzucamy redirect poza blok try/catch (dobre praktyki Next.js)
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
      <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-background">
        <Sidebar role={user.role} />

        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white dark:bg-background dark:border-border px-8">
            <div className="text-sm text-slate-500 dark:text-muted-foreground">
              Zalogowano jako:{" "}
              <span className="font-semibold text-slate-900 dark:text-foreground">
                {user.firstName} {user.lastName}
              </span>{" "}
              ({user.role})
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 dark:text-destructive"
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
