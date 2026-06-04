"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Award, Plus } from "lucide-react";
import {
  createEmployeeCertificationAction,
  getCertificationDictionaryAction,
  getEmployeeCertificationsAction,
} from "@/app/actions/certifications.actions";
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
  CertificationDictionaryItem,
  CreateEmployeeCertificationPayload,
  EmployeeCertification,
} from "@/types/certifications";

type CertificationFormState = {
  dictionaryId: string;
  certificateNumber: string;
  issuedAt: string;
  expiresAt: string;
};

const emptyForm: CertificationFormState = {
  dictionaryId: "",
  certificateNumber: "",
  issuedAt: "",
  expiresAt: "",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pl-PL");
}

function getDaysToExpiry(expiresAt: string) {
  return Math.ceil(
    (new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24),
  );
}

function addMonths(dateValue: string, months: number) {
  const date = new Date(dateValue);
  date.setMonth(date.getMonth() + months);

  return date.toISOString().split("T")[0];
}

export function EmployeeCertificationsSection({
  employeeId,
  activeFacilityId,
  canManageCertifications,
}: {
  employeeId: string;
  activeFacilityId: string;
  canManageCertifications: boolean;
}) {
  const queryClient = useQueryClient();

  const [dictionary, setDictionary] = useState<CertificationDictionaryItem[]>(
    [],
  );
  const [certifications, setCertifications] = useState<EmployeeCertification[]>(
    [],
  );
  const [form, setForm] = useState<CertificationFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDictionaryItem = useMemo(() => {
    return dictionary.find((item) => item.id === form.dictionaryId) ?? null;
  }, [dictionary, form.dictionaryId]);

  async function refreshCertifications() {
    const response = await getEmployeeCertificationsAction(
      employeeId,
      activeFacilityId,
    );

    setCertifications(response.data);
  }

  useEffect(() => {
    let isCancelled = false;

    Promise.all([
      getCertificationDictionaryAction(),
      getEmployeeCertificationsAction(employeeId, activeFacilityId),
    ])
      .then(([dictionaryResponse, certificationsResponse]) => {
        if (isCancelled) return;

        setDictionary(dictionaryResponse.data.filter((item) => item.isActive));
        setCertifications(certificationsResponse.data);
        setError(null);
      })
      .catch((err) => {
        if (isCancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Nie udało się pobrać danych certyfikatów.",
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

  function handleIssuedAtChange(value: string) {
    const selected = dictionary.find((item) => item.id === form.dictionaryId);

    setForm((prev) => ({
      ...prev,
      issuedAt: value,
      expiresAt:
        value && selected?.defaultValidityMonths
          ? addMonths(value, selected.defaultValidityMonths)
          : prev.expiresAt,
    }));
  }

  function handleDictionaryChange(dictionaryId: string) {
    const selected = dictionary.find((item) => item.id === dictionaryId);

    setForm((prev) => ({
      ...prev,
      dictionaryId,
      expiresAt:
        prev.issuedAt && selected?.defaultValidityMonths
          ? addMonths(prev.issuedAt, selected.defaultValidityMonths)
          : prev.expiresAt,
    }));
  }

  async function handleCreateCertification() {
    setError(null);

    if (!form.dictionaryId) {
      setError("Wybierz typ szkolenia, badania lub uprawnienia.");
      return;
    }

    if (!form.issuedAt) {
      setError("Data wydania jest wymagana.");
      return;
    }

    if (!form.expiresAt) {
      setError("Data ważności jest wymagana.");
      return;
    }

    const payload: CreateEmployeeCertificationPayload = {
      dictionaryId: form.dictionaryId,
      issuedAt: form.issuedAt,
      expiresAt: form.expiresAt,
      ...(form.certificateNumber.trim()
        ? { certificateNumber: form.certificateNumber.trim() }
        : {}),
    };

    setIsSaving(true);

    try {
      await createEmployeeCertificationAction(
        employeeId,
        payload,
        activeFacilityId,
      );

      await refreshCertifications();

      await queryClient.invalidateQueries({
        queryKey: ["employeeProfile"],
      });

      setForm(emptyForm);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się dodać certyfikatu.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Kwalifikacje i badania
        </CardTitle>
        <CardDescription>
          Szkolenia BHP, badania lekarskie oraz uprawnienia pracownika.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {canManageCertifications && (
          <div className="rounded-md border p-4 space-y-4">
            <div className="flex items-center gap-2 font-medium">
              <Plus className="h-4 w-4" />
              Dodaj szkolenie / badanie / uprawnienie
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Typ</label>
                <Select
                  value={form.dictionaryId}
                  onValueChange={handleDictionaryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz z listy" />
                  </SelectTrigger>
                  <SelectContent>
                    {dictionary.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} ({item.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Numer</label>
                <Input
                  value={form.certificateNumber}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      certificateNumber: event.target.value,
                    }))
                  }
                  placeholder="np. BHP/2026/001"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Wydano</label>
                <Input
                  type="date"
                  value={form.issuedAt}
                  onChange={(event) => handleIssuedAtChange(event.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Ważne do
                </label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      expiresAt: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {selectedDictionaryItem?.defaultValidityMonths && (
              <p className="text-xs text-muted-foreground">
                Wybrana pozycja ma domyślną ważność:{" "}
                {selectedDictionaryItem.defaultValidityMonths} mies.
              </p>
            )}

            <Button onClick={handleCreateCertification} disabled={isSaving}>
              {isSaving ? "Zapisywanie..." : "Dodaj wpis"}
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            Ładowanie certyfikatów...
          </div>
        ) : certifications.length === 0 ? (
          <div className="text-center p-6 border border-dashed rounded-lg">
            <p className="text-muted-foreground text-sm">
              Brak szkoleń, badań lub uprawnień w bazie.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certifications.map((cert) => {
              const daysToExpiry = getDaysToExpiry(cert.expiresAt);
              const isExpired = daysToExpiry < 0;
              const isExpiringSoon = daysToExpiry >= 0 && daysToExpiry <= 30;

              return (
                <div
                  key={cert.id}
                  className={`p-4 border rounded-md flex flex-col justify-between ${
                    isExpired
                      ? "border-red-200 bg-red-50/50"
                      : isExpiringSoon
                        ? "border-orange-200 bg-orange-50/50"
                        : "bg-muted/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold">{cert.dictionary.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Nr: {cert.certificateNumber || "Brak numeru"}
                      </p>
                    </div>

                    <Badge
                      variant={
                        cert.dictionary.type === "BHP" ? "default" : "secondary"
                      }
                    >
                      {cert.dictionary.type}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center text-sm border-t pt-3">
                    <span className="text-muted-foreground">
                      Wydano: {formatDate(cert.issuedAt)}
                    </span>

                    <span
                      className={`font-semibold ${
                        isExpired
                          ? "text-red-600"
                          : isExpiringSoon
                            ? "text-orange-600"
                            : "text-primary"
                      }`}
                    >
                      Ważne do: {formatDate(cert.expiresAt)}
                    </span>
                  </div>

                  {cert.documents.length > 0 && (
                    <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                      Dokumenty:{" "}
                      {cert.documents.map((doc) => doc.fileName).join(", ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
