"use client";

import { useDashboardSummary } from "@/hooks/useDashboard";
import { WidgetCard } from "./WidgetCard";
import { Clock, Hammer, ShieldAlert, CheckCircle2 } from "lucide-react";

export function ForemanWidgets() {
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
        title="Aktywne Projekty"
        value={stats?.activeProjectsCount || 0}
        subtitle="Na przypisanym zakładzie"
        icon={CheckCircle2}
        statusType="success"
        isLoading={isLoading}
      />
      <WidgetCard
        title="Obecni na zmianie"
        value={stats?.presentWorkersCount || 0}
        subtitle="Zarejestrowani dzisiaj przez czytnik"
        icon={Hammer}
        statusType="neutral"
        isLoading={isLoading}
      />
      <WidgetCard
        title="Czas do akceptacji"
        value={stats?.pendingTimeEntriesCount || 0}
        subtitle="Wymaga Twojego zatwierdzenia"
        icon={Clock}
        statusType="alert"
        isLoading={isLoading}
      />
      <WidgetCard
        title="Sprzęt u załogi"
        value={stats?.activeEquipmentCount || 0}
        subtitle="Oczekujący zwrot do końca tygodnia"
        icon={ShieldAlert}
        statusType="neutral"
        isLoading={isLoading}
      />
    </>
  );
}
