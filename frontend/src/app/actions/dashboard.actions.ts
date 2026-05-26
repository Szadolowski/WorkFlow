"use server";

import { serverFetch } from "@/lib/api-client";

export async function getDashboardSummaryAction(facilityId?: string) {
  try {
    // Jeśli z frontendu przekazano ID zakładu, dołączamy je do adresu
    const endpoint = facilityId
      ? `/dashboard/summary?facilityId=${facilityId}`
      : "/dashboard/summary";

    const response = await serverFetch(endpoint);

    if (!response.ok) {
      throw new Error(`Błąd pobierania dashboardu: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[Dashboard Action Error]:", error);
    throw new Error("Nie udało się pobrać podsumowania");
  }
}
