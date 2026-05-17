"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEmployeesAction,
  createEmployeeAction,
  getEmployeeProfileAction,
  CreateEmployeePayload,
} from "@/app/actions/employees.actions";

/**
 * Hook do pobierania listy pracowników.
 * Automatycznie cache'uje dane i reaguje na zmiany paginacji/filtrów.
 */
export function useEmployeesQuery(
  page = 1,
  limit = 10,
  role?: string,
  isActive?: string,
) {
  return useQuery({
    // queryKey gwarantuje, że przy zmianie np. strony, Query pobierze nowe dane
    queryKey: ["employees", { page, limit, role, isActive }],
    queryFn: () => getEmployeesAction(page, limit, role, isActive),
  });
}

/**
 * Hook do tworzenia nowego pracownika.
 * Po sukcesie automatycznie odświeża tabelę.
 */
export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmployeePayload) => createEmployeeAction(data),
    onSuccess: () => {
      // Inwalidacja cache: Zmuszamy TanStack Query do ponownego pobrania listy z bazy,
      // aby nowy pracownik od razu pojawił się w tabeli.
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

/**
 * ==========================================
 * NOWE: Hook do pobierania pełnego profilu
 * ==========================================
 */
export function useEmployeeProfileQuery(employeeId: string) {
  return useQuery({
    queryKey: ["employeeProfile", employeeId],
    queryFn: () => getEmployeeProfileAction(employeeId),
    enabled: !!employeeId, // Uruchom zapytanie tylko wtedy, gdy posiadamy ID
    staleTime: 1000 * 60 * 5, // Trzymaj dane w cache przez 5 minut
  });
}
