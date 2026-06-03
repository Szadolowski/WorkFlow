"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getEmployeesAction,
  createEmployeeAction,
  getEmployeeProfileAction,
  updateEmployeeAccessAction,
  revokeEmployeeAccessAction,
} from "@/app/actions/employees.actions";
import { useFacility } from "@/hooks/useFacility";
import type {
  CreateEmployeePayload,
  UpdateEmployeeAccessPayload,
} from "@/types/employees";

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

type UpdateEmployeeAccessMutationInput = {
  employeeId: string;
  data: UpdateEmployeeAccessPayload;
};

export function useUpdateEmployeeAccessMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, data }: UpdateEmployeeAccessMutationInput) =>
      updateEmployeeAccessAction(employeeId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({
        queryKey: ["employeeProfile", variables.employeeId],
      });
    },
  });
}

export function useEmployeeProfileQuery(employeeId: string) {
  const { activeFacilityId } = useFacility();

  return useQuery({
    queryKey: ["employeeProfile", activeFacilityId, employeeId],
    queryFn: () => getEmployeeProfileAction(employeeId, activeFacilityId),
    enabled: !!employeeId && !!activeFacilityId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useRevokeEmployeeAccessMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: string) => revokeEmployeeAccessAction(employeeId),
    onSuccess: (_data, employeeId) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({
        queryKey: ["employeeProfile", employeeId],
      });
    },
  });
}
