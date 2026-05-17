"use server";

import { serverFetch } from "@/lib/api-client";

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
) {
  // 1. Budowanie parametrów zapytania (URLSearchParams dba o czyszczenie undefined)
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (role) params.append("role", role);
  if (isActive) params.append("isActive", isActive);

  // 2. Strzał do NestJS przez nasz gotowy wrapper (który dodaje JWT)
  const res = await serverFetch(`/employees?${params.toString()}`);

  if (!res.ok) {
    throw new Error("Błąd podczas pobierania listy pracowników.");
  }

  return res.json();
}

export async function createEmployeeAction(data: CreateEmployeePayload) {
  const res = await serverFetch("/employees", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    // Przechwytujemy komunikaty z NestJS (np. duplikat PESEL/email)
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Nie udało się dodać pracownika.");
  }

  return res.json();
}

// ==========================================
// NOWE: Pobieranie profilu pracownika
// ==========================================
export async function getEmployeeProfileAction(id: string) {
  const res = await serverFetch(`/employees/${id}/profile`);

  if (!res.ok) {
    if (res.status === 403)
      throw new Error("Brak uprawnień do przeglądania tego profilu.");
    if (res.status === 404)
      throw new Error("Pracownik nie istnieje lub został usunięty.");
    throw new Error("Błąd podczas pobierania profilu pracownika.");
  }

  return res.json();
}
