"use client";

import { useDashboardSummary } from "@/hooks/useDashboard";
import { WidgetCard } from "./WidgetCard";
import { Users, AlertTriangle, FileCheck, HardHat } from "lucide-react";

export function HrWidgets() {
  // Tylko ten mały komponent "wie" o TanStack Query i pobieraniu danych
  const { data: stats, isLoading, isError } = useDashboardSummary();

  if (isError) {
    return (
      <div className="col-span-full rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive font-semibold">
        Wystąpił błąd podczas pobierania statystyk.
      </div>
    );
  }

  return (
    <>
      <WidgetCard
        title="Aktywni Pracownicy"
        value={stats?.activeEmployeesCount || 0}
        subtitle="Przypisani do tego oddziału"
        icon={Users}
        statusType="success"
        isLoading={isLoading}
      />
      <WidgetCard
        title="Aktywne Umowy"
        value={stats?.activeContractsCount || 0}
        subtitle="Zarządzane w tym zakładzie"
        icon={FileCheck}
        statusType="neutral"
        isLoading={isLoading}
      />
      <WidgetCard
        title="Wygasające BHP (30 dni)"
        value={stats?.expiringCertsCount || 0}
        subtitle="Wymagają natychmiastowej akcji"
        icon={AlertTriangle}
        statusType="alert"
        isLoading={isLoading}
      />
      <WidgetCard
        title="Wypożyczony Sprzęt"
        value={stats?.activeEquipmentCount || 0}
        subtitle="Zasoby w terenie u pracowników"
        icon={HardHat}
        statusType="neutral"
        isLoading={isLoading}
      />
    </>
  );
}
