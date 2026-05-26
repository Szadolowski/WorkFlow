import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Hammer, ShieldAlert, CheckCircle2 } from "lucide-react";

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
        {/* WIDGET 1: Sukces / Pozytywny (Używa Teal/Mint) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aktywne Projekty
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">3</div>
            <p className="text-xs text-muted-foreground">
              Na przypisanym zakładzie
            </p>
          </CardContent>
        </Card>

        {/* WIDGET 2: Neutralny (Pracownicy na zmianie) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Obecni na zmianie
            </CardTitle>
            <Hammer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              Zarejestrowani dzisiaj przez czytnik
            </p>
          </CardContent>
        </Card>

        {/* WIDGET 3: Alert (Copper/Orange) - Oczekujące na zatwierdzenie */}
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              Czas do akceptacji
            </CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">8</div>
            <p className="text-xs text-destructive/80">
              Wymaga Twojego zatwierdzenia
            </p>
          </CardContent>
        </Card>

        {/* WIDGET 4: Moduł Sprzętu - Wypożyczenia */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sprzęt u załogi
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">
              Oczekujący zwrot do końca tygodnia
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
