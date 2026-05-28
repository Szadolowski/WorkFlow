import { ForemanWidgets } from "./ForemanWidgets";

// Czysty Server Component bez "use client"!
export default function ForemanDashboard() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Panel Brygadzisty</h2>
        <p className="text-muted-foreground">
          Zarządzanie załogą, czasem pracy i sprzętem na budowie.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Renderujemy kliencką "wyspę" z pobieraniem danych */}
        <ForemanWidgets />
      </div>
    </div>
  );
}
