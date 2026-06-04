"use server";

import { serverFetch } from "@/lib/api-client";
import type {
  CertificationDictionaryResponse,
  CreateEmployeeCertificationPayload,
  EmployeeCertificationSingleResponse,
  EmployeeCertificationsResponse,
} from "@/types/certifications";

export async function getCertificationDictionaryAction(): Promise<CertificationDictionaryResponse> {
  const res = await serverFetch("/certifications/dictionary");

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || "Nie udało się pobrać słownika certyfikacji.",
    );
  }

  return res.json();
}

export async function getEmployeeCertificationsAction(
  employeeId: string,
  facilityId?: string,
): Promise<EmployeeCertificationsResponse> {
  const params = new URLSearchParams();

  if (facilityId) {
    params.set("facilityId", facilityId);
  }

  const url = `/employees/${employeeId}/certifications${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const res = await serverFetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || "Nie udało się pobrać certyfikatów pracownika.",
    );
  }

  return res.json();
}

export async function createEmployeeCertificationAction(
  employeeId: string,
  payload: CreateEmployeeCertificationPayload,
  facilityId?: string,
): Promise<EmployeeCertificationSingleResponse> {
  const params = new URLSearchParams();

  if (facilityId) {
    params.set("facilityId", facilityId);
  }

  const url = `/employees/${employeeId}/certifications${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const res = await serverFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || "Nie udało się dodać certyfikatu pracownika.",
    );
  }

  return res.json();
}
