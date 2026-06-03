"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getActiveProjectsAction,
  createProjectAction,
  assignEmployeesAction,
  CreateProjectPayload,
  AssignEmployeesPayload,
} from "@/app/actions/projects.actions";
import { getProjectDetailsAction } from "@/app/actions/projects.actions";
import { useFacility } from "@/hooks/useFacility";

export function useProjectDetailsQuery(projectId: string) {
  const { activeFacilityId } = useFacility();

  return useQuery({
    queryKey: ["projects", activeFacilityId, projectId],
    queryFn: () => getProjectDetailsAction(projectId, activeFacilityId),
    enabled: !!projectId && !!activeFacilityId,
  });
}

export function useActiveProjectsQuery() {
  const { activeFacilityId } = useFacility();

  return useQuery({
    queryKey: ["projects", "active", activeFacilityId],
    queryFn: () => getActiveProjectsAction(activeFacilityId),
    enabled: !!activeFacilityId,
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  const { activeFacilityId } = useFacility();

  return useMutation({
    mutationFn: (data: CreateProjectPayload) =>
      createProjectAction(data, activeFacilityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useAssignEmployeesMutation(projectId: string) {
  const queryClient = useQueryClient();
  const { activeFacilityId } = useFacility();

  return useMutation({
    mutationFn: (data: AssignEmployeesPayload) =>
      assignEmployeesAction(projectId, {
        ...data,
        facilityId: activeFacilityId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employeeProfile"] });
    },
  });
}
