import { HrWidgets } from "./HrWidgets";

// Zwróć uwagę: BRAK "use client"! To jest czysty, serwerowy komponent.
// Wysyłamy do przeglądarki tylko czysty HTML z nagłówkiem i paragrafem.
export default function HrDashboard() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Panel Kadrowy (HR)
        </h2>
        <p className="text-muted-foreground">
          Przegląd kluczowych wskaźników zatrudnienia i terminów w aktualnym
          zakładzie.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Renderujemy nasz kliencki komponent (wyspa interaktywności) */}
        <HrWidgets />
      </div>
    </div>
  );
}
