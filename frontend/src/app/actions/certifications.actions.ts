"use server";

import { serverFetch } from "@/lib/api-client";
import type {
  CertificationDictionaryResponse,
  CertificationDictionarySingleResponse,
  CreateCertificationDictionaryPayload,
  CreateEmployeeCertificationPayload,
  EmployeeCertificationSingleResponse,
  EmployeeCertificationsResponse,
  UpdateCertificationDictionaryPayload,
  ExpiringCertificationsResponse,
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

export async function createCertificationDictionaryAction(
  payload: CreateCertificationDictionaryPayload,
): Promise<CertificationDictionarySingleResponse> {
  const res = await serverFetch("/certifications/dictionary", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Nie udało się dodać pozycji do słownika.");
  }

  return res.json();
}

export async function updateCertificationDictionaryAction(
  id: string,
  payload: UpdateCertificationDictionaryPayload,
): Promise<CertificationDictionarySingleResponse> {
  const res = await serverFetch(`/certifications/dictionary/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || "Nie udało się zaktualizować pozycji słownika.",
    );
  }

  return res.json();
}

export async function getExpiringCertificationsAction(
  facilityId: string,
  days: number,
): Promise<ExpiringCertificationsResponse> {
  const params = new URLSearchParams();

  params.set("facilityId", facilityId);
  params.set("days", String(days));

  const res = await serverFetch(
    `/certifications/expiring?${params.toString()}`,
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || "Nie udało się pobrać wygasających certyfikatów.",
    );
  }

  return res.json();
}
