import { cookies } from "next/headers";

export async function serverFetch(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const activeFacilityId = cookieStore.get("active_facility_id")?.value;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  // BEZPIECZNE ŁĄCZENIE ADRESÓW (rozwiązuje problem usuwania prefiksu np. /api)
  const baseUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:2000"
  ).replace(/\/$/, "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const requestUrl = new URL(`${baseUrl}${path}`);

  if (activeFacilityId && !requestUrl.searchParams.has("facilityId")) {
    requestUrl.searchParams.set("facilityId", activeFacilityId);
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(requestUrl, {
    ...options,
    headers,
    // [ZMIANA] Wyłączamy chamskie cache'owanie fetch'a w Next.js
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error("Brak autoryzacji (401)");
  }

  return response;
}
