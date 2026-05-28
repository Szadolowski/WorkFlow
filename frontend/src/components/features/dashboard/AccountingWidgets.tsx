"use client";

import { useDashboardSummary } from "@/hooks/useDashboard";
import { WidgetCard } from "./WidgetCard";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function AccountingWidgets() {
  const { data: stats, isLoading, isError } = useDashboardSummary();

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive font-semibold">
        Wystąpił błąd podczas pobierania statystyk.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Górna sekcja - Kafelki */}
      <div className="grid gap-4 md:grid-cols-2">
        <WidgetCard
          title="Niezatwierdzone godziny (PENDING)"
          value={stats?.pendingTimeEntriesCount || 0}
          subtitle="Wymagają weryfikacji przed eksportem"
          icon={AlertCircle}
          statusType="alert" // Użyje naszego koloru Copper/Orange z Design Systemu
          isLoading={isLoading}
        />
        <WidgetCard
          title="Gotowe do eksportu (APPROVED)"
          value={stats?.approvedTimeEntriesCount || 0}
          subtitle="Zatwierdzone w obecnym miesiącu"
          icon={CheckCircle2}
          statusType="success" // Użyje naszego koloru Teal/Mint z Design Systemu
          isLoading={isLoading}
        />
      </div>

      {/* 2. Dolna sekcja - Wykres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Przepracowane roboczogodziny (Ostatnie 7 dni)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-87.5 w-full pb-4">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.weeklyChartData || []}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}h`}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                {/* Zgodnie z wytycznymi słupki używają koloru powiązanego z sukcesem/akcentem (Teal/Mint) */}
                <Bar
                  dataKey="hours"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
