import { AccountingWidgets } from "./AccountingWidgets";

// Czysty Server Component (Push Client Down)
export default function AccountingDashboard() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Panel Księgowości</h2>
        <p className="text-muted-foreground">
          Kontrola ewidencji czasu pracy i przygotowanie do eksportu list płac.
        </p>
      </div>

      <AccountingWidgets />
    </div>
  );
}
