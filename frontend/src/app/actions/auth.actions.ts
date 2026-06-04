"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// 1. Definiujemy precyzyjny kontrakt (typ) dla stanu formularza
export type ActionState = {
  error?: string;
  success?: boolean;
} | null;

// 2. Zamieniamy 'any' na nasz nowy typ ActionState
export async function loginAction(prevState: ActionState, formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    return { error: "Wypełnij wszystkie pola." };
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:2000"}/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return { error: "Błędne poświadczenia. Spróbuj ponownie." };
  }

  const data = await response.json();

  const cookieStore = await cookies();
  cookieStore.set("access_token", data.access_token, {
    httpOnly: true,
    secure: process.env.AUTH_COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token"); // Niszczymy bilet wstępu
  cookieStore.delete("active_facility_id");
  redirect("/login"); // Wyrzucamy użytkownika do formularza
}

export async function getProfileAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  // Jeśli nie ma tokena, od razu zwracamy błąd
  if (!token) {
    return { error: "Brak tokena autoryzacji." };
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:2000"}/auth/me`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Przekazujemy token JWT
        },
        cache: "no-store", // Dashboard musi mieć zawsze świeże dane
      },
    );

    if (!response.ok) {
      return { error: "Sesja wygasła lub brak dostępu." };
    }

    // Zwracamy obiekt użytkownika (zdekodowany przez backend), w tym jego .role
    return await response.json();
  } catch {
    return { error: "Błąd połączenia z serwerem." };
  }
}
