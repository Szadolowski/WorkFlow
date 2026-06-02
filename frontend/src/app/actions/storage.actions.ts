"use server";

import { cookies } from "next/headers";

export async function getEmployeeDocumentDownloadUrlAction(
  employeeId: string,
  documentId: string,
  facilityId?: string,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return { error: "Brak tokena autoryzacji." };
  }

  const params = new URLSearchParams();

  if (facilityId) {
    params.append("facilityId", facilityId);
  }

  const queryString = params.toString();
  const url = `/employees/${employeeId}/documents/${documentId}/download-url${
    queryString ? `?${queryString}` : ""
  }`;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:2000"}${url}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return {
        error: err.message || "Nie udało się pobrać linku do dokumentu.",
      };
    }

    return await response.json();
  } catch {
    return { error: "Błąd serwera podczas pobierania." };
  }
}

export async function getEmployeeDocumentUploadUrlAction(
  employeeId: string,
  fileName: string,
  facilityId?: string,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return { error: "Brak tokena autoryzacji." };
  }

  const params = new URLSearchParams({
    fileName,
  });

  if (facilityId) {
    params.append("facilityId", facilityId);
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:2000"}/employees/${employeeId}/documents/upload-url?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return {
        error: err.message || "Nie udało się wygenerować linku uploadu.",
      };
    }

    return await response.json();
  } catch {
    return { error: "Błąd połączenia z backendem." };
  }
}
