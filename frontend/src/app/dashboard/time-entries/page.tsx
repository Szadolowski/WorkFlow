"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Clock3, X } from "lucide-react";
import { useFacility } from "@/hooks/useFacility";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getPendingTimeEntriesAction,
  updateTimeEntryStatusAction,
} from "@/app/actions/time-entries.actions";
import type { PendingTimeEntry } from "@/types/time-entries";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function TimeEntriesPage() {
  const { activeFacilityId, activeFacility } = useFacility();

  const [entries, setEntries] = useState<PendingTimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setError(null);

    if (!activeFacilityId) {
      setEntries([]);
      setError("Wybierz aktywny zakład.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await getPendingTimeEntriesAction(activeFacilityId);
      setEntries(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się pobrać wpisów czasu pracy.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeFacilityId]);

  useEffect(() => {
    if (!activeFacilityId) {
      return;
    }

    let isCancelled = false;

    getPendingTimeEntriesAction(activeFacilityId)
      .then((response) => {
        if (isCancelled) return;

        setEntries(response.data);
        setError(null);
      })
      .catch((err) => {
        if (isCancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Nie udało się pobrać wpisów czasu pracy.",
        );
      })
      .finally(() => {
        if (isCancelled) return;

        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeFacilityId]);

  async function handleStatusChange(
    entryId: string,
    status: "APPROVED" | "REJECTED",
  ) {
    setProcessingId(entryId);
    setError(null);

    try {
      await updateTimeEntryStatusAction(entryId, { status });
      await loadEntries();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się zmienić statusu wpisu.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Czas pracy</h1>
        <p className="text-muted-foreground">
          Zatwierdzanie wpisów czasu pracy zarejestrowanych przez urządzenia.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5" />
            Oczekujące wpisy
          </CardTitle>
          <CardDescription>
            Aktywny zakład:{" "}
            <span className="font-medium">
              {activeFacility?.name || "brak aktywnego zakładu"}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={loadEntries}
              disabled={isLoading}
            >
              Odśwież
            </Button>
          </div>

          {isLoading ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Ładowanie wpisów czasu pracy...
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Brak wpisów oczekujących na zatwierdzenie.
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="min-w-215 w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Pracownik</th>
                      <th className="px-4 py-3 font-medium">Projekt</th>
                      <th className="px-4 py-3 font-medium">Start</th>
                      <th className="px-4 py-3 font-medium">Koniec</th>
                      <th className="px-4 py-3 font-medium">Godziny</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Akcje
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} className="border-t">
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {entry.employee.firstName} {entry.employee.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {entry.employee.role}
                          </div>
                        </td>

                        <td className="px-4 py-3">{entry.project.name}</td>

                        <td className="px-4 py-3">
                          {formatDateTime(entry.startTime)}
                        </td>

                        <td className="px-4 py-3">
                          {formatDateTime(entry.endTime)}
                        </td>

                        <td className="px-4 py-3">
                          {Number(entry.calculatedHours).toFixed(2)} h
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processingId === entry.id}
                              onClick={() =>
                                handleStatusChange(entry.id, "REJECTED")
                              }
                            >
                              <X className="mr-1 h-4 w-4" />
                              Odrzuć
                            </Button>

                            <Button
                              size="sm"
                              disabled={processingId === entry.id}
                              onClick={() =>
                                handleStatusChange(entry.id, "APPROVED")
                              }
                            >
                              <Check className="mr-1 h-4 w-4" />
                              Zatwierdź
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
