"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { useFacility } from "@/hooks/useFacility";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;

  const match = disposition.match(/filename="?([^"]+)"?/);

  return match?.[1] || null;
}

export default function PayrollPage() {
  const { activeFacilityId, activeFacility } = useFacility();
  const now = new Date();

  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setError(null);

    if (!activeFacilityId) {
      setError("Wybierz aktywny zakład.");
      return;
    }

    const numericMonth = Number(month);
    const numericYear = Number(year);

    if (
      !Number.isInteger(numericMonth) ||
      numericMonth < 1 ||
      numericMonth > 12
    ) {
      setError("Miesiąc musi być liczbą od 1 do 12.");
      return;
    }

    if (
      !Number.isInteger(numericYear) ||
      numericYear < 2000 ||
      numericYear > 2100
    ) {
      setError("Rok musi być liczbą od 2000 do 2100.");
      return;
    }

    setIsExporting(true);

    try {
      const params = new URLSearchParams({
        month: String(numericMonth),
        year: String(numericYear),
        facilityId: activeFacilityId,
      });

      const response = await fetch(`/download/payroll/export?${params.toString()}`, {
  	method: "GET",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
          errorBody.error || "Nie udało się wygenerować raportu.",
        );
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const filename =
        getFilenameFromDisposition(
          response.headers.get("content-disposition"),
        ) || `Raport_Plac_${numericMonth}_${numericYear}.xlsx`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Wystąpił nieznany błąd podczas eksportu.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Płace</h1>
        <p className="text-muted-foreground">
          Eksport listy płac dla aktywnego zakładu.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Eksport XLSX
          </CardTitle>
          <CardDescription>
            Raport zostanie wygenerowany dla aktualnie wybranego zakładu:{" "}
            <span className="font-medium">
              {activeFacility?.name || "brak aktywnego zakładu"}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Miesiąc</label>
              <Input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Rok</label>
              <Input
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Generowanie..." : "Eksportuj XLSX"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
