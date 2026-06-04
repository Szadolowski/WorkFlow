"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { useEmployeesQuery } from "@/hooks/useEmployees";
import AddEmployeeDialog from "@/components/employees/AddEmployeeDialog";
import EmployeeAccessDialog from "@/components/employees/EmployeeAccessDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { EmployeeListItem } from "@/types/employees";
import { useFacility } from "@/hooks/useFacility";

type SortKey = "fullName" | "email" | "pesel" | "role" | "status";
type SortDirection = "asc" | "desc";

type ColumnFilters = {
  fullName: string;
  email: string;
  pesel: string;
  role: string;
  status: string;
};

const emptyFilters: ColumnFilters = {
  fullName: "",
  email: "",
  pesel: "",
  role: "",
  status: "",
};

function normalizeSearchValue(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getEmployeeSortValue(employee: EmployeeListItem, sortKey: SortKey) {
  switch (sortKey) {
    case "fullName":
      return `${employee.firstName} ${employee.lastName}`;
    case "email":
      return employee.email || "";
    case "pesel":
      return employee.pesel || "";
    case "role":
      return employee.role;
    case "status":
      return employee.isActive ? "aktywny" : "nieaktywny";
    default:
      return "";
  }
}

export default function EmployeesPage() {
  const { data, isLoading, isError } = useEmployeesQuery();
  const { currentUser } = useFacility();
  const router = useRouter();

  const [filters, setFilters] = useState<ColumnFilters>(emptyFilters);
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const isAdmin = currentUser.role === "ADMIN";
  const isForeman = currentUser.role === "FOREMAN";
  const canViewSensitiveEmployeeData = !isForeman;
  const canOpenEmployeeProfile = !isForeman;

  const hasActiveFilters = Object.values(filters).some(
    (value) => value.trim().length > 0,
  );

  const tableColumnCount =
    1 + // imię i nazwisko
    1 + // email
    (canViewSensitiveEmployeeData ? 1 : 0) + // PESEL
    1 + // rola
    1 + // status
    (isAdmin ? 2 : 0); // dostęp + akcje

  const filteredEmployees = useMemo(() => {
    const employees = data?.data ?? [];

    const normalizedFilters = {
      fullName: normalizeSearchValue(filters.fullName.trim()),
      email: normalizeSearchValue(filters.email.trim()),
      pesel: normalizeSearchValue(filters.pesel.trim()),
      role: normalizeSearchValue(filters.role.trim()),
      status: normalizeSearchValue(filters.status.trim()),
    };

    return employees
      .filter((employee: EmployeeListItem) => {
        const fullName = normalizeSearchValue(
          `${employee.firstName} ${employee.lastName}`,
        );
        const email = normalizeSearchValue(employee.email);
        const pesel = normalizeSearchValue(employee.pesel);
        const role = normalizeSearchValue(employee.role);
        const status = normalizeSearchValue(
          employee.isActive ? "aktywny active" : "nieaktywny inactive",
        );

        return (
          fullName.includes(normalizedFilters.fullName) &&
          email.includes(normalizedFilters.email) &&
          pesel.includes(normalizedFilters.pesel) &&
          role.includes(normalizedFilters.role) &&
          status.includes(normalizedFilters.status)
        );
      })
      .sort((a: EmployeeListItem, b: EmployeeListItem) => {
        const valueA = normalizeSearchValue(getEmployeeSortValue(a, sortKey));
        const valueB = normalizeSearchValue(getEmployeeSortValue(b, sortKey));
        const result = valueA.localeCompare(valueB, "pl");

        return sortDirection === "asc" ? result : -result;
      });
  }, [data, filters, sortDirection, sortKey]);

  function updateFilter(key: keyof ColumnFilters, value: string) {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function toggleSort(nextSortKey: SortKey) {
    if (sortKey === nextSortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection("asc");
  }

  function renderSortIcon(currentSortKey: SortKey) {
    if (sortKey !== currentSortKey) {
      return null;
    }

    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  }

  return (
    <div className="bg-card text-card-foreground rounded-xl shadow-sm border p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pracownicy</h1>
          <p className="text-muted-foreground">
            Zarządzaj kadrą, rolami i dostępami w systemie.
          </p>
        </div>

        <AddEmployeeDialog />
      </div>

      {isLoading && (
        <div className="py-8 text-center text-muted-foreground animate-pulse">
          Pobieranie danych z serwera...
        </div>
      )}

      {isError && (
        <div className="py-8 text-center text-red-500">
          Wystąpił błąd podczas pobierania danych. Upewnij się, że backend jest
          uruchomiony.
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="mb-4 space-y-3 rounded-lg border bg-muted/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Filtrowanie pracowników
              </p>
              <p className="text-xs text-muted-foreground">
                Filtry działają równocześnie i wyszukują fragment tekstu.
              </p>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => setFilters(emptyFilters)}
                className="text-sm font-medium text-primary hover:underline"
              >
                Wyczyść filtry
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.fullName}
                onChange={(event) =>
                  updateFilter("fullName", event.target.value)
                }
                placeholder="Imię lub nazwisko"
                className="pl-9"
              />
            </div>

            <Input
              value={filters.email}
              onChange={(event) => updateFilter("email", event.target.value)}
              placeholder="Email"
            />

            {canViewSensitiveEmployeeData && (
              <Input
                value={filters.pesel}
                onChange={(event) => updateFilter("pesel", event.target.value)}
                placeholder="PESEL"
              />
            )}

            <Input
              value={filters.role}
              onChange={(event) => updateFilter("role", event.target.value)}
              placeholder="Rola"
            />

            <Input
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
              placeholder="Status"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Wynik: {filteredEmployees.length} z {data.data.length} pracowników.
          </p>
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="rounded-md border">
          <Table className="min-w-275">
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("fullName")}
                    className="font-medium hover:text-primary"
                  >
                    Imię i nazwisko {renderSortIcon("fullName")}
                  </button>
                </TableHead>

                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("email")}
                    className="font-medium hover:text-primary"
                  >
                    Email {renderSortIcon("email")}
                  </button>
                </TableHead>

                {canViewSensitiveEmployeeData && (
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleSort("pesel")}
                      className="font-medium hover:text-primary"
                    >
                      PESEL {renderSortIcon("pesel")}
                    </button>
                  </TableHead>
                )}

                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("role")}
                    className="font-medium hover:text-primary"
                  >
                    Rola {renderSortIcon("role")}
                  </button>
                </TableHead>

                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="font-medium hover:text-primary"
                  >
                    Status {renderSortIcon("status")}
                  </button>
                </TableHead>

                {isAdmin && <TableHead>Dostęp</TableHead>}
                {isAdmin && <TableHead className="text-right">Akcje</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={tableColumnCount}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {hasActiveFilters
                      ? "Brak pracowników pasujących do wybranych filtrów."
                      : 'Brak pracowników w bazie. Kliknij "Dodaj pracownika", aby rozpocząć!'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee: EmployeeListItem) => (
                  <TableRow
                    key={employee.id}
                    onClick={() => {
                      if (canOpenEmployeeProfile) {
                        router.push(`/dashboard/employees/${employee.id}`);
                      }
                    }}
                    className={
                      canOpenEmployeeProfile
                        ? "cursor-pointer hover:bg-muted/50 transition-colors"
                        : "cursor-default"
                    }
                  >
                    <TableCell className="font-medium text-foreground">
                      {employee.firstName} {employee.lastName}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {employee.email || "—"}
                    </TableCell>

                    {canViewSensitiveEmployeeData && (
                      <TableCell className="text-muted-foreground">
                        {employee.pesel || "—"}
                      </TableCell>
                    )}

                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground border">
                        {employee.role}
                      </span>
                    </TableCell>

                    <TableCell>
                      {employee.isActive ? (
                        <span className="text-green-600 font-medium text-sm">
                          Aktywny
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium text-sm">
                          Nieaktywny
                        </span>
                      )}
                    </TableCell>

                    {isAdmin && (
                      <>
                        <TableCell>
                          {employee.isLoginEnabled ? (
                            <span className="text-blue-600 font-medium text-sm">
                              Konto aktywne
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-medium text-sm">
                              Brak dostępu
                            </span>
                          )}
                        </TableCell>

                        <TableCell
                          className="text-right"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <EmployeeAccessDialog
                            employeeId={employee.id}
                            currentRole={employee.role}
                            isLoginEnabled={employee.isLoginEnabled}
                          />
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
