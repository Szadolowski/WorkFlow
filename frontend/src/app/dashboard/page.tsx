import { Suspense } from "react";
import HrDashboard from "@/components/features/dashboard/HrDashboard";
import ForemanDashboard from "@/components/features/dashboard/ForemanDashboard";

export default async function DashboardPage() {
  // TODO: Docelowo pobierzemy to z tokena JWT / mechanizmu sesji po stronie serwera
  // Na ten moment używamy "zaślepki" (mocka) do testowania naszych widoków.
  // Zmień tę wartość na "FOREMAN" lub "WORKER", by przetestować inne widoki.
  const mockUserRole = "HR" as string;

  let DashboardContent;

  switch (mockUserRole) {
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
            Twój standardowy panel pracowniczy jest w przygotowaniu.
          </p>
        </div>
      );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      {/* Suspense pozwoli nam na wyświetlenie ładnego "szkieletu" (Skeleton), 
          gdy wewnątrz widoków zaczniemy pobierać prawdziwe dane z bazy. */}
      <Suspense
        fallback={
          <div className="text-muted-foreground">Ładowanie widoku...</div>
        }
      >
        {DashboardContent}
      </Suspense>
    </div>
  );
}
