"use server";

import { serverFetch } from "@/lib/api-client";

export type CreateProjectPayload = {
  name: string;
  internalCode: string;
  address?: string;
  startDate?: string;
  endDate?: string;
};

export type AssignEmployeesPayload = {
  employeeIds: string[];
  facilityId?: string;
};

export async function getActiveProjectsAction(facilityId?: string) {
  const params = new URLSearchParams();

  if (facilityId) {
    params.set("facilityId", facilityId);
  }

  const url = `/projects${params.toString() ? `?${params.toString()}` : ""}`;

  const res = await serverFetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Nie udało się pobrać listy projektów.");
  }

  return res.json();
}

export async function createProjectAction(
  data: CreateProjectPayload,
  facilityId?: string,
) {
  const params = new URLSearchParams();

  if (facilityId) {
    params.set("facilityId", facilityId);
  }

  const url = `/projects${params.toString() ? `?${params.toString()}` : ""}`;

  const res = await serverFetch(url, {
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
  const params = new URLSearchParams();

  if (data.facilityId) {
    params.set("facilityId", data.facilityId);
  }

  const url = `/projects/${projectId}/assignments${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const res = await serverFetch(url, {
    method: "POST",
    body: JSON.stringify({ employeeIds: data.employeeIds }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Błąd podczas przypisywania pracowników.");
  }

  return res.json();
}

export async function getProjectDetailsAction(
  projectId: string,
  facilityId?: string,
) {
  const params = new URLSearchParams();

  if (facilityId) {
    params.set("facilityId", facilityId);
  }

  const url = `/projects/${projectId}${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const res = await serverFetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Nie udało się pobrać szczegółów projektu.");
  }

  return res.json();
}
