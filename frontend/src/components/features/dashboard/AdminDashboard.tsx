import { AdminWidgets } from "./AdminWidgets";

export default function AdminDashboard() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Panel Administratora
        </h2>
        <p className="text-muted-foreground">
          Pełny przegląd stanu systemu, licencji i ostatnich zdarzeń (Audit
          Trail).
        </p>
      </div>

      <AdminWidgets />
    </div>
  );
}
