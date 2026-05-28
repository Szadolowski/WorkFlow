"use server";

import { serverFetch } from "@/lib/api-client";

export async function getDashboardSummaryAction(facilityId?: string) {
  try {
    const endpoint = facilityId
      ? `/dashboard/summary?facilityId=${facilityId}`
      : "/dashboard/summary";

    const response = await serverFetch(endpoint, {
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Dashboard Action] Błąd API:", errorText);
      throw new Error(`Błąd pobierania danych (Status: ${response.status})`);
    }

    const json = await response.json();
    return json.data; // Zwracamy obiekt z naszymi statystykami
  } catch (error) {
    console.error("[Dashboard Action] Wyjątek:", error);
    throw new Error("Nie udało się pobrać podsumowania dashboardu.");
  }
}
