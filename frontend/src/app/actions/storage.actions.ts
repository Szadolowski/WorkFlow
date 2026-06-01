"use server";

import { cookies } from "next/headers";

export async function getUploadUrlAction(fileName: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return { error: "Brak tokena autoryzacji." };
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:2000"}/storage/upload-url?fileName=${encodeURIComponent(fileName)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store", // Wyłączamy cache, linki zawsze muszą być unikalne
      },
    );

    if (!response.ok) {
      return { error: "Błąd serwera podczas generowania bezpiecznego linku." };
    }

    // Zwróci nam obiekt: { url: "...", fileKey: "..." }
    return await response.json();
  } catch {
    return { error: "Błąd połączenia z backendem." };
  }
}

export async function getDownloadUrlAction(fileKey: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:2000"}/storage/download-url?fileKey=${encodeURIComponent(fileKey)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    return await response.json();
  } catch {
    return { error: "Błąd serwera podczas pobierania." };
  }
}
