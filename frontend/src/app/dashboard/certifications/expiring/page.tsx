"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { getExpiringCertificationsAction } from "@/app/actions/certifications.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFacility } from "@/hooks/useFacility";
import type {
  CertificationType,
  ExpiringCertificationItem,
  ExpiringCertificationsResponse,
} from "@/types/certifications";

const dayOptions = [30, 60, 90, 180, 365];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pl-PL");
}

function normalizeSearchValue(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getTypeLabel(type: CertificationType) {
  switch (type) {
    case "BHP":
      return "BHP";
    case "MEDICAL":
      return "Badania lekarskie";
    case "UDT":
      return "UDT";
    case "OTHER":
      return "Inne";
    default:
      return type;
  }
}

function getExpiryStatus(certification: ExpiringCertificationItem) {
  if (certification.daysToExpiry < 0) {
    return {
      label: "Wygasł",
      className: "text-red-600",
      badgeVariant: "destructive" as const,
    };
  }

  if (certification.daysToExpiry <= 14) {
    return {
      label: `${certification.daysToExpiry} dni`,
      className: "text-red-600",
      badgeVariant: "destructive" as const,
    };
  }

  if (certification.daysToExpiry <= 30) {
    return {
      label: `${certification.daysToExpiry} dni`,
      className: "text-orange-600",
      badgeVariant: "secondary" as const,
    };
  }

  return {
    label: `${certification.daysToExpiry} dni`,
    className: "text-primary",
    badgeVariant: "outline" as const,
  };
}

export default function ExpiringCertificationsPage() {
  const { activeFacilityId, activeFacility } = useFacility();

  const [days, setDays] = useState(30);
  const [searchQuery, setSearchQuery] = useState("");
  const [response, setResponse] =
    useState<ExpiringCertificationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeFacilityId) {
      return;
    }

    let isCancelled = false;

    getExpiringCertificationsAction(activeFacilityId, days)
      .then((result) => {
        if (isCancelled) return;

        setResponse(result);
        setError(null);
      })
      .catch((err) => {
        if (isCancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Nie udało się pobrać wygasających certyfikatów.",
        );
      })
      .finally(() => {
        if (isCancelled) return;

        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeFacilityId, days]);

  const certifications = useMemo(() => response?.data ?? [], [response]);

  const visibleCertifications = useMemo(() => {
    const query = normalizeSearchValue(searchQuery.trim());

    if (!query) {
      return certifications;
    }

    return certifications.filter((certification) => {
      const searchableValue = [
        certification.employee.firstName,
        certification.employee.lastName,
        certification.employee.email,
        certification.employee.role,
        certification.employee.facility.name,
        certification.employee.facility.code,
        certification.dictionary.name,
        certification.dictionary.type,
        getTypeLabel(certification.dictionary.type),
        certification.certificateNumber,
        certification.daysToExpiry.toString(),
      ]
        .map(normalizeSearchValue)
        .join(" ");

      return searchableValue.includes(query);
    });
  }, [certifications, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Wygasające certyfikaty
        </h1>
        <p className="text-muted-foreground">
          Szkolenia BHP, badania i uprawnienia kończące ważność w wybranym
          zakresie.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Kontrola ważności
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Zakres dni
              </label>
              <Select
                value={String(days)}
                onValueChange={(value) => setDays(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Zakres" />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option} dni
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Wyszukiwanie
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Szukaj po pracowniku, typie, nazwie certyfikatu, zakładzie..."
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-slate-50 p-4 text-sm dark:bg-slate-900">
            <p className="font-medium">
              Zakład:{" "}
              {activeFacility
                ? `${activeFacility.name}${
                    activeFacility.code ? ` (${activeFacility.code})` : ""
                  }`
                : "Brak aktywnego zakładu"}
            </p>
            <p className="text-muted-foreground">
              Znaleziono: {response?.meta.total ?? 0} certyfikatów w zakresie{" "}
              {days} dni.
            </p>
          </div>

          {isLoading ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Ładowanie wygasających certyfikatów...
            </div>
          ) : visibleCertifications.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Brak certyfikatów pasujących do wybranego zakresu lub filtra.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Pracownik</th>
                    <th className="px-4 py-3 font-medium">Certyfikat</th>
                    <th className="px-4 py-3 font-medium">Typ</th>
                    <th className="px-4 py-3 font-medium">Numer</th>
                    <th className="px-4 py-3 font-medium">Ważne do</th>
                    <th className="px-4 py-3 font-medium">Pozostało</th>
                    <th className="px-4 py-3 font-medium text-right">Akcje</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleCertifications.map((certification) => {
                    const status = getExpiryStatus(certification);

                    return (
                      <tr key={certification.id} className="border-t">
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {certification.employee.firstName}{" "}
                            {certification.employee.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {certification.employee.email || "Brak e-maila"}
                          </div>
                        </td>

                        <td className="px-4 py-3 font-medium">
                          {certification.dictionary.name}
                        </td>

                        <td className="px-4 py-3">
                          <Badge variant="outline">
                            {getTypeLabel(certification.dictionary.type)}
                          </Badge>
                        </td>

                        <td className="px-4 py-3">
                          {certification.certificateNumber || "—"}
                        </td>

                        <td className="px-4 py-3">
                          {formatDate(certification.expiresAt)}
                        </td>

                        <td className="px-4 py-3">
                          <Badge variant={status.badgeVariant}>
                            <span className={status.className}>
                              {status.label}
                            </span>
                          </Badge>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href={`/dashboard/employees/${certification.employee.id}`}
                            >
                              Profil
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
