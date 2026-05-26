import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForemanDashboard() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Panel Brygadzisty</h2>
        <p className="text-muted-foreground">
          Zarządzanie załogą, czasem pracy i sprzętem na budowie.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Zaraz dodamy dane...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
