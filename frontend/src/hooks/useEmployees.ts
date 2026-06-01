"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEmployeesAction,
  createEmployeeAction,
  getEmployeeProfileAction,
  CreateEmployeePayload,
} from "@/app/actions/employees.actions";
import { useFacility } from "@/hooks/useFacility";

export function useEmployeesQuery(
  page = 1,
  limit = 10,
  role?: string,
  isActive?: string,
) {
  const { activeFacilityId } = useFacility();

  return useQuery({
    queryKey: ["employees", activeFacilityId, { page, limit, role, isActive }],
    queryFn: () =>
      getEmployeesAction(page, limit, role, isActive, activeFacilityId),
  });
}

type CreateEmployeeMutationInput = {
  data: CreateEmployeePayload;
  facilityId: string;
};

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, facilityId }: CreateEmployeeMutationInput) =>
      createEmployeeAction(data, facilityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useEmployeeProfileQuery(employeeId: string) {
  const { activeFacilityId } = useFacility();

  return useQuery({
    queryKey: ["employeeProfile", activeFacilityId, employeeId],
    queryFn: () => getEmployeeProfileAction(employeeId, activeFacilityId),
    enabled: !!employeeId, // Uruchom zapytanie tylko wtedy, gdy posiadamy ID
    staleTime: 1000 * 60 * 5, // Trzymaj dane w cache przez 5 minut
  });
}
