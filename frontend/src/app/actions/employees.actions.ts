"use server";

import { serverFetch } from "@/lib/api-client";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
// Typy wejściowe (DTO) dla frontendu
export type CreateEmployeePayload = {
  firstName: string;
  lastName: string;
  pesel: string;
  email: string;
  role: string;
};

export async function getEmployeesAction(
  page = 1,
  limit = 10,
  role?: string,
  isActive?: string,
  facilityId?: string,
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (role) params.append("role", role);
  if (isActive) params.append("isActive", isActive);
  if (facilityId) params.append("facilityId", facilityId);

  const res = await serverFetch(`/employees?${params.toString()}`);

  if (!res.ok) {
    throw new Error("Błąd podczas pobierania listy pracowników.");
  }

  return res.json();
}

export async function createEmployeeAction(
  data: CreateEmployeePayload,
  facilityId?: string,
) {
  const url = facilityId
    ? `/employees?facilityId=${encodeURIComponent(facilityId)}`
    : "/employees";
  const res = await serverFetch(url, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Nie udało się dodać pracownika.");
  }

  return res.json();
}

export async function getEmployeeProfileAction(
  id: string,
  facilityId?: string,
) {
  const url = facilityId
    ? `/employees/${id}/profile?facilityId=${encodeURIComponent(facilityId)}`
    : `/employees/${id}/profile`;
  const res = await serverFetch(url);

  if (!res.ok) {
    if (res.status === 403)
      throw new Error("Brak uprawnień do przeglądania tego profilu.");
    if (res.status === 404)
      throw new Error("Pracownik nie istnieje lub został usunięty.");
    throw new Error("Błąd podczas pobierania profilu pracownika.");
  }

  return res.json();
}

// ==========================================
// NOWE: Zapis dokumentu (MinIO klucz) do bazy
// ==========================================
export async function addDocumentAction(
  employeeId: string,
  fileName: string,
  fileKey: string,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:2000"}/employees/${employeeId}/documents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileName, fileKey }),
      },
    );

    revalidatePath(`/dashboard/employees/${employeeId}`);

    return await response.json();
  } catch {
    return { error: "Błąd zapisu do bazy danych." };
  }
}
