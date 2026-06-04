"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarOff, CheckCircle2, Plus, XCircle } from "lucide-react";
import {
  createAbsenceAction,
  getEmployeeAbsencesAction,
  updateAbsenceApprovalAction,
} from "@/app/actions/absences.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AbsenceType,
  CreateAbsencePayload,
  EmployeeAbsence,
} from "@/types/absences";

type AbsenceFormState = {
  type: AbsenceType;
  startDate: string;
  endDate: string;
  isApproved: boolean;
};

const emptyForm: AbsenceFormState = {
  type: "HOLIDAY",
  startDate: "",
  endDate: "",
  isApproved: false,
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pl-PL");
}

function getAbsenceTypeLabel(type: AbsenceType) {
  switch (type) {
    case "HOLIDAY":
      return "Urlop";
    case "SICK_LEAVE":
      return "L4 / chorobowe";
    case "UNEXCUSED":
      return "Nieusprawiedliwiona";
    case "SPECIAL":
      return "Specjalna";
    default:
      return type;
  }
}

function getAbsenceDurationDays(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffMs = end.getTime() - start.getTime();

  return Math.floor(diffMs / (1000 * 3600 * 24)) + 1;
}

export function EmployeeAbsencesSection({
  employeeId,
  activeFacilityId,
  canManageAbsences,
}: {
  employeeId: string;
  activeFacilityId: string;
  canManageAbsences: boolean;
}) {
  const [absences, setAbsences] = useState<EmployeeAbsence[]>([]);
  const [form, setForm] = useState<AbsenceFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshAbsences() {
    const response = await getEmployeeAbsencesAction(
      employeeId,
      activeFacilityId,
    );

    setAbsences(response.data);
  }

  useEffect(() => {
    let isCancelled = false;

    getEmployeeAbsencesAction(employeeId, activeFacilityId)
      .then((response) => {
        if (isCancelled) return;

        setAbsences(response.data);
        setError(null);
      })
      .catch((err) => {
        if (isCancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Nie udało się pobrać nieobecności.",
        );
      })
      .finally(() => {
        if (isCancelled) return;

        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeFacilityId, employeeId]);

  const sortedAbsences = useMemo(() => {
    return [...absences].sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );
  }, [absences]);

  async function handleCreateAbsence() {
    setError(null);

    if (!form.startDate) {
      setError("Data rozpoczęcia nieobecności jest wymagana.");
      return;
    }

    if (!form.endDate) {
      setError("Data zakończenia nieobecności jest wymagana.");
      return;
    }

    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError(
        "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.",
      );
      return;
    }

    const payload: CreateAbsencePayload = {
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      isApproved: form.isApproved,
    };

    setIsSaving(true);

    try {
      await createAbsenceAction(employeeId, payload, activeFacilityId);
      await refreshAbsences();
      setForm(emptyForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się dodać nieobecności.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleApprovalChange(absence: EmployeeAbsence) {
    setProcessingId(absence.id);
    setError(null);

    try {
      await updateAbsenceApprovalAction(
        absence.id,
        {
          isApproved: !absence.isApproved,
        },
        activeFacilityId,
      );

      await refreshAbsences();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się zmienić zatwierdzenia nieobecności.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarOff className="w-5 h-5 text-primary" />
          Historia nieobecności
        </CardTitle>
        <CardDescription>
          Urlopy, zwolnienia L4 oraz inne nieobecności pracownika.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {canManageAbsences && (
          <div className="rounded-md border p-4 space-y-4">
            <div className="flex items-center gap-2 font-medium">
              <Plus className="h-4 w-4" />
              Dodaj nieobecność
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Typ</label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      type: value as AbsenceType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Typ nieobecności" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOLIDAY">Urlop</SelectItem>
                    <SelectItem value="SICK_LEAVE">L4 / chorobowe</SelectItem>
                    <SelectItem value="UNEXCUSED">
                      Nieusprawiedliwiona
                    </SelectItem>
                    <SelectItem value="SPECIAL">Specjalna</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Data od
                </label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      startDate: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Data do
                </label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      endDate: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <Select
                  value={form.isApproved ? "approved" : "pending"}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      isApproved: value === "approved",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Oczekuje</SelectItem>
                    <SelectItem value="approved">Zatwierdzona</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleCreateAbsence} disabled={isSaving}>
              {isSaving ? "Zapisywanie..." : "Dodaj nieobecność"}
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            Ładowanie nieobecności...
          </div>
        ) : sortedAbsences.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-lg bg-slate-50/30">
            <CalendarOff className="w-8 h-8 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-sm font-medium">Brak nieobecności</p>
            <p className="text-xs text-muted-foreground mt-1">
              Pracownik nie ma jeszcze wpisanych urlopów, L4 ani innych
              nieobecności.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3 font-medium">Typ</th>
                  <th className="px-4 py-3 font-medium">Od</th>
                  <th className="px-4 py-3 font-medium">Do</th>
                  <th className="px-4 py-3 font-medium">Dni</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Dokument</th>
                  {canManageAbsences && (
                    <th className="px-4 py-3 font-medium text-right">Akcje</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {sortedAbsences.map((absence) => (
                  <tr key={absence.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      {getAbsenceTypeLabel(absence.type)}
                    </td>

                    <td className="px-4 py-3">
                      {formatDate(absence.startDate)}
                    </td>

                    <td className="px-4 py-3">{formatDate(absence.endDate)}</td>

                    <td className="px-4 py-3">
                      {getAbsenceDurationDays(
                        absence.startDate,
                        absence.endDate,
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {absence.isApproved ? (
                        <Badge className="bg-green-600 hover:bg-green-700">
                          Zatwierdzona
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Oczekuje</Badge>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {absence.document ? absence.document.fileName : "—"}
                    </td>

                    {canManageAbsences && (
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === absence.id}
                          onClick={() => handleApprovalChange(absence)}
                        >
                          {absence.isApproved ? (
                            <>
                              <XCircle className="mr-1 h-4 w-4" />
                              Cofnij
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Zatwierdź
                            </>
                          )}
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
