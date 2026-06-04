"use server";

import { serverFetch } from "@/lib/api-client";
import type {
  CreateAbsencePayload,
  EmployeeAbsenceSingleResponse,
  EmployeeAbsencesResponse,
  UpdateAbsenceApprovalPayload,
} from "@/types/absences";

export async function getEmployeeAbsencesAction(
  employeeId: string,
  facilityId?: string,
): Promise<EmployeeAbsencesResponse> {
  const params = new URLSearchParams();

  if (facilityId) {
    params.set("facilityId", facilityId);
  }

  const url = `/employees/${employeeId}/absences${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const res = await serverFetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Nie udało się pobrać nieobecności.");
  }

  return res.json();
}

export async function createAbsenceAction(
  employeeId: string,
  payload: CreateAbsencePayload,
  facilityId?: string,
): Promise<EmployeeAbsenceSingleResponse> {
  const params = new URLSearchParams();

  if (facilityId) {
    params.set("facilityId", facilityId);
  }

  const url = `/employees/${employeeId}/absences${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const res = await serverFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Nie udało się dodać nieobecności.");
  }

  return res.json();
}

export async function updateAbsenceApprovalAction(
  absenceId: string,
  payload: UpdateAbsenceApprovalPayload,
  facilityId?: string,
): Promise<EmployeeAbsenceSingleResponse> {
  const params = new URLSearchParams();

  if (facilityId) {
    params.set("facilityId", facilityId);
  }

  const url = `/absences/${absenceId}/approval${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const res = await serverFetch(url, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || "Nie udało się zmienić zatwierdzenia nieobecności.",
    );
  }

  return res.json();
}
