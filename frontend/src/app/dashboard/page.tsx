import { Suspense } from "react";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/api-client";

import HrDashboard from "@/components/features/dashboard/HrDashboard";
import ForemanDashboard from "@/components/features/dashboard/ForemanDashboard";

export default async function DashboardPage() {
  let role = "WORKER";

  try {
    // Odpytujemy bezpiecznie backend z poziomu serwera by sprawdzić rolę usera
    const res = await serverFetch("/auth/me");
    if (res.ok) {
      const data = await res.json();
      role = data.user.role;
    } else {
      redirect("/login");
    }
  } catch (error) {
    redirect("/login");
  }

  let DashboardContent;

  // Renderowanie oparte na Roli (Strategy Pattern z wytycznych)
  switch (role) {
    case "HR":
      DashboardContent = <HrDashboard />;
      break;
    case "FOREMAN":
      DashboardContent = <ForemanDashboard />;
      break;
    default:
      DashboardContent = (
        <div className="p-6">
          <h1 className="text-2xl font-bold">Witaj w systemie!</h1>
          <p className="text-muted-foreground mt-2">
            Twój spersonalizowany panel pracowniczy jest w przygotowaniu.
          </p>
        </div>
      );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <Suspense
        fallback={
          <div className="text-muted-foreground">
            Ładowanie widoku głównego...
          </div>
        }
      >
        {DashboardContent}
      </Suspense>
    </div>
  );
}
