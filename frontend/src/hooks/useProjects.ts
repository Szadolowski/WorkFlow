"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    queryFn: () => getProjectDetailsAction(projectId),
  });
}

export function useActiveProjectsQuery() {
  const { activeFacilityId } = useFacility();

  return useQuery({
    queryKey: ["projects", "active", activeFacilityId],
    queryFn: () => getActiveProjectsAction(),
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectPayload) => createProjectAction(data),
    onSuccess: () => {
      // Automatyczne odświeżenie tabeli projektów po dodaniu nowej budowy
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useAssignEmployeesMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignEmployeesPayload) =>
      assignEmployeesAction(projectId, data),
    onSuccess: () => {
      // Odświeżenie danych o konkretnym projekcie po zmianie obsady
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
