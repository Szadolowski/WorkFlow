import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, FileCheck, HardHat } from "lucide-react";

export default function HrDashboard() {
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
        {/* WIDGET 1: Sukces / Pozytywny (Używa naszego Teal/Mint z globals.css jako secondary) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aktywni Pracownicy
            </CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">142</div>
            <p className="text-xs text-muted-foreground">
              +4 od zeszłego miesiąca
            </p>
          </CardContent>
        </Card>

        {/* WIDGET 2: Neutralny */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktywne Umowy</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">138</div>
            <p className="text-xs text-muted-foreground">
              4 umowy wygasają w tym miesiącu
            </p>
          </CardContent>
        </Card>

        {/* WIDGET 3: Alert Krytyczny (Używa naszego Copper/Orange z globals.css jako destructive) */}
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              Wygasające BHP (30 dni)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">12</div>
            <p className="text-xs text-destructive/80">
              Wymagają natychmiastowej akcji
            </p>
          </CardContent>
        </Card>

        {/* WIDGET 4: Moduł Sprzętu (który przed chwilą dodaliśmy do bazy) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Wypożyczony Sprzęt
            </CardTitle>
            <HardHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">Zasoby w terenie</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
