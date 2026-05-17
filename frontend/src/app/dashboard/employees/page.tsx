"use client";

import { useEmployeesQuery } from "@/hooks/useEmployees";
import AddEmployeeDialog from "@/components/employees/AddEmployeeDialog";
import { useRouter } from "next/navigation"; // <-- Dodany import z Next.js
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Definicja typu, żeby linter nie krzyczał o "any"
type EmployeeListDto = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  pesel: string;
  role: string;
  isActive: boolean;
};

export default function EmployeesPage() {
  const { data, isLoading, isError } = useEmployeesQuery();
  const router = useRouter(); // <-- Inicjalizacja routera

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pracownicy</h1>
          <p className="text-slate-500">
            Zarządzaj kadrą, rolami i dostępami w systemie.
          </p>
        </div>
        <AddEmployeeDialog />
      </div>

      {isLoading && (
        <div className="py-8 text-center text-slate-500 animate-pulse">
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imię i nazwisko</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>PESEL</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-slate-500"
                  >
                    Brak pracowników w bazie. Kliknij "Dodaj pracownika", aby
                    rozpocząć!
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((employee: EmployeeListDto) => (
                  <TableRow
                    key={employee.id}
                    // Dodajemy zdarzenie kliknięcia i style UX
                    onClick={() =>
                      router.push(`/dashboard/employees/${employee.id}`)
                    }
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <TableCell className="font-medium text-slate-900">
                      {employee.firstName} {employee.lastName}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {employee.email}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {employee.pesel}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 border">
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
