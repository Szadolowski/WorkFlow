"use client";

import { useDashboardSummary } from "@/hooks/useDashboard";
import { WidgetCard } from "./WidgetCard";
import { Building2, Users, FolderKanban, Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Definiujemy strukturę danych z backendu, aby pozbyć się typu "any"
interface AuditLogItem {
  id: string;
  createdAt: string;
  action: string;
  entityName: string;
  entityId: string;
  employee?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function AdminWidgets() {
  const { data: stats, isLoading, isError } = useDashboardSummary();

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive font-semibold">
        Wystąpił błąd podczas pobierania statystyk dla Admina.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Górna sekcja - Kafelki */}
      <div className="grid gap-4 md:grid-cols-3">
        <WidgetCard
          title="Zarejestrowane Zakłady"
          value={stats?.totalFacilitiesCount || 0}
          subtitle="Aktywne oddziały i siedziby"
          icon={Building2}
          statusType="success"
          isLoading={isLoading}
        />
        <WidgetCard
          title="Wszyscy Pracownicy"
          value={stats?.totalEmployeesCount || 0}
          subtitle="Konta we wszystkich zakładach"
          icon={Users}
          statusType="success"
          isLoading={isLoading}
        />
        <WidgetCard
          title="Aktywne Projekty"
          value={stats?.totalProjectsCount || 0}
          subtitle="Realizowane w całym systemie"
          icon={FolderKanban}
          statusType="success"
          isLoading={isLoading}
        />
      </div>

      {/* 2. Dolna sekcja - Audit Trail */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">
                Dziennik Zdarzeń (Audit Trail)
              </CardTitle>
              <CardDescription>
                Ostatnie aktywności zarejestrowane w systemie WorkFlow.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Użytkownik</TableHead>
                    <TableHead>Akcja</TableHead>
                    <TableHead>Zasób (ID)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.recentAuditLogs?.length > 0 ? (
                    // Wstrzykujemy zdefiniowany typ!
                    stats.recentAuditLogs.map((log: AuditLogItem) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {new Date(log.createdAt).toLocaleString("pl-PL")}
                        </TableCell>
                        <TableCell>
                          {log.employee?.firstName} {log.employee?.lastName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.entityName}{" "}
                          <span className="text-xs">
                            ({log.entityId.split("-")[0]}...)
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Brak ostatnich logów w systemie.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
