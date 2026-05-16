"use server";

import { serverFetch } from "@/lib/api-client";

// Typy zbieżne z naszym DTO z NestJS
export type CreateProjectPayload = {
  name: string;
  internalCode: string;
  address?: string;
  startDate?: string;
  endDate?: string;
};

export type AssignEmployeesPayload = {
  employeeIds: string[];
};

export async function getActiveProjectsAction() {
  const res = await serverFetch("/projects");
  if (!res.ok) throw new Error("Nie udało się pobrać listy projektów.");
  return res.json();
}

export async function createProjectAction(data: CreateProjectPayload) {
  const res = await serverFetch("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Błąd podczas tworzenia projektu.");
  }
  return res.json();
}

export async function assignEmployeesAction(
  projectId: string,
  data: AssignEmployeesPayload,
) {
  const res = await serverFetch(`/projects/${projectId}/assignments`, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Błąd podczas przypisywania pracowników.");
  }
  return res.json();
}
