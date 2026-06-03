"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  getFacilityEmployeesAction,
  updateFacilityEmployeesAction,
} from "@/app/actions/facilities.actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  FacilityEmployeeAccessItem,
  FacilityEmployeesResponse,
} from "@/types/facilities";

function normalizeSearchValue(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function FacilityEmployeesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const facilityId = resolvedParams.id;

  const [data, setData] = useState<FacilityEmployeesResponse["data"] | null>(
    null,
  );
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<
    string[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const assignedEmployeeIds = useMemo<string[]>(() => {
    if (!data) {
      return [];
    }

    return data.employees
      .filter((employee) => employee.isAssigned)
      .map((employee) => employee.id);
  }, [data]);

  const selectedIds = selectedEmployeeIds ?? assignedEmployeeIds;

  const normalizedSearchQuery = normalizeSearchValue(searchQuery.trim());

  const visibleEmployees = useMemo<FacilityEmployeeAccessItem[]>(() => {
    if (!data) {
      return [];
    }

    if (!normalizedSearchQuery) {
      return data.employees.filter(
        (employee) => employee.isAssigned || selectedIds.includes(employee.id),
      );
    }

    return data.employees.filter((employee) => {
      const searchableValue = [
        employee.firstName,
        employee.lastName,
        employee.email,
        employee.role,
        employee.primaryFacility.name,
        employee.primaryFacility.code,
      ]
        .map(normalizeSearchValue)
        .join(" ");

      return searchableValue.includes(normalizedSearchQuery);
    });
  }, [data, normalizedSearchQuery, selectedIds]);

  useEffect(() => {
    let isCancelled = false;

    getFacilityEmployeesAction(facilityId)
      .then((response) => {
        if (isCancelled) return;

        setData(response.data);
        setError(null);
      })
      .catch((err) => {
        if (isCancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Nie udało się pobrać pracowników zakładu.",
        );
      })
      .finally(() => {
        if (isCancelled) return;

        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [facilityId]);

  function toggleEmployee(employee: FacilityEmployeeAccessItem) {
    if (employee.isPrimaryFacility) {
      return;
    }

    setSelectedEmployeeIds((prev: string[] | null) => {
      const current: string[] = prev ?? assignedEmployeeIds;

      return current.includes(employee.id)
        ? current.filter((id: string) => id !== employee.id)
        : [...current, employee.id];
    });
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await updateFacilityEmployeesAction(facilityId, {
        employeeIds: selectedIds,
      });

      setData(response.data);
      setSelectedEmployeeIds(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się zapisać przypisań pracowników.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const assignedCount = selectedIds.length;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/facilities">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Wróć do zakładów
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Pracownicy zakładu
        </h1>
        <p className="text-muted-foreground">
          Zarządzanie dostępem pracowników do wybranego zakładu.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {data
              ? `${data.facility.name}${
                  data.facility.code ? ` (${data.facility.code})` : ""
                }`
              : "Zakład"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Ładowanie pracowników...
            </div>
          ) : !data ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nie udało się wczytać danych zakładu.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-md border bg-slate-50 p-4 dark:bg-slate-900">
                <div>
                  <p className="font-medium">
                    Przypisani pracownicy: {assignedCount}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pracowników z głównym zakładem nie można odpiąć z tego
                    miejsca.
                  </p>
                </div>

                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Zapisywanie..." : "Zapisz przypisania"}
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Szukaj po imieniu, nazwisku, e-mailu, roli lub zakładzie..."
                  className="pl-9"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Bez wyszukiwania widoczni są tylko pracownicy już przypisani do
                tego zakładu. Aby dodać nową osobę, wpisz fragment imienia,
                nazwiska albo e-maila.
              </p>

              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left dark:bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 font-medium">Przypisany</th>
                      <th className="px-4 py-3 font-medium">Pracownik</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Rola</th>
                      <th className="px-4 py-3 font-medium">Główny zakład</th>
                      <th className="px-4 py-3 font-medium">Typ dostępu</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleEmployees.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          {searchQuery.trim()
                            ? "Brak pracowników pasujących do wyszukiwania."
                            : "Brak przypisanych pracowników. Użyj wyszukiwarki, aby dodać osoby do zakładu."}
                        </td>
                      </tr>
                    ) : (
                      visibleEmployees.map((employee) => {
                        const isChecked = selectedIds.includes(employee.id);

                        return (
                          <tr key={employee.id} className="border-t">
                            <td className="px-4 py-3">
                              <Checkbox
                                checked={isChecked}
                                disabled={employee.isPrimaryFacility}
                                onCheckedChange={() => toggleEmployee(employee)}
                              />
                            </td>

                            <td className="px-4 py-3 font-medium">
                              {employee.firstName} {employee.lastName}
                            </td>

                            <td className="px-4 py-3">
                              {employee.email || "—"}
                            </td>

                            <td className="px-4 py-3">{employee.role}</td>

                            <td className="px-4 py-3">
                              {employee.primaryFacility.name}
                              {employee.primaryFacility.code
                                ? ` (${employee.primaryFacility.code})`
                                : ""}
                            </td>

                            <td className="px-4 py-3">
                              {employee.isPrimaryFacility ? (
                                <span className="font-medium text-green-600">
                                  Główny zakład
                                </span>
                              ) : employee.hasAdditionalAccess ? (
                                <span className="font-medium text-blue-600">
                                  Dodatkowy dostęp
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  Brak dostępu
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
