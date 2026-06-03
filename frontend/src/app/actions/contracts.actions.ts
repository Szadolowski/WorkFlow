"use server";

import { serverFetch } from "@/lib/api-client";
import type {
  CreateEmployeeContractPayload,
  EmployeeContractsResponse,
  EmployeeContractSingleResponse,
} from "@/types/contracts";

export async function getEmployeeContractsAction(
  employeeId: string,
  facilityId?: string,
): Promise<EmployeeContractsResponse> {
  const params = new URLSearchParams();

  if (facilityId) {
    params.set("facilityId", facilityId);
  }

  const url = `/employees/${employeeId}/contracts${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const res = await serverFetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Nie udało się pobrać historii umów.");
  }

  return res.json();
}

export async function createEmployeeContractAction(
  employeeId: string,
  payload: CreateEmployeeContractPayload,
  facilityId?: string,
): Promise<EmployeeContractSingleResponse> {
  const params = new URLSearchParams();

  if (facilityId) {
    params.set("facilityId", facilityId);
  }

  const url = `/employees/${employeeId}/contracts${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const res = await serverFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Nie udało się dodać umowy.");
  }

  return res.json();
}
