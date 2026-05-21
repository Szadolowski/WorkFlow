"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEmployeesAction,
  createEmployeeAction,
  getEmployeeProfileAction,
  CreateEmployeePayload,
} from "@/app/actions/employees.actions";
import { useFacility } from "@/hooks/useFacility";

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
  const { activeFacilityId } = useFacility();

  return useQuery({
    // queryKey gwarantuje, że przy zmianie np. strony, Query pobierze nowe dane
    queryKey: ["employees", activeFacilityId, { page, limit, role, isActive }],
    queryFn: () =>
      getEmployeesAction(page, limit, role, isActive, activeFacilityId),
  });
}

/**
 * Hook do tworzenia nowego pracownika.
 * Po sukcesie automatycznie odświeża tabelę.
 */
export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient();
  const { activeFacilityId } = useFacility();

  return useMutation({
    mutationFn: (data: CreateEmployeePayload) =>
      createEmployeeAction(data, activeFacilityId),
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
  const { activeFacilityId } = useFacility();

  return useQuery({
    queryKey: ["employeeProfile", activeFacilityId, employeeId],
    queryFn: () => getEmployeeProfileAction(employeeId, activeFacilityId),
    enabled: !!employeeId, // Uruchom zapytanie tylko wtedy, gdy posiadamy ID
    staleTime: 1000 * 60 * 5, // Trzymaj dane w cache przez 5 minut
  });
}
