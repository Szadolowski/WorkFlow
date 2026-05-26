"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, FileCheck, HardHat } from "lucide-react";
import { useDashboardSummaryQuery } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function HrDashboard() {
  // Pobieramy dane z naszego nowego hooka!
  const { data: response, isLoading, isError } = useDashboardSummaryQuery();

  if (isError) {
    return (
      <div className="text-destructive font-semibold">
        Nie udało się załadować danych dashboardu.
      </div>
    );
  }

  // Wypakowujemy nasze statystyki
  const stats = response?.data;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Panel Kadrowy (HR)
        </h2>
        <p className="text-muted-foreground">
          Przegląd kluczowych wskaźników zatrudnienia i terminów.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aktywni Pracownicy
            </CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-secondary">
                {stats?.activeEmployeesCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">W wybranym oddziale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktywne Umowy</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.activeContractsCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">W wybranym oddziale</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              Wygasające BHP (30 dni)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16 bg-destructive/20" />
            ) : (
              <div className="text-2xl font-bold text-destructive">
                {stats?.expiringCertsCount || 0}
              </div>
            )}
            <p className="text-xs text-destructive/80">
              Wymagają natychmiastowej akcji
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Wypożyczony Sprzęt
            </CardTitle>
            <HardHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.activeEquipmentCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Zasoby w terenie</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
