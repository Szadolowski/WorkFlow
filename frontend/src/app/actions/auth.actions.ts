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

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:2000"}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      },
    );

    if (!response.ok) {
      return { error: "Błędne poświadczenia. Spróbuj ponownie." };
    }

    const data = await response.json();

    const cookieStore = await cookies();
    cookieStore.set("access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60,
    });

    return { success: true };
  } catch {
    // 3. Usuwamy deklarację zmiennej 'error' z bloku catch, skoro i tak zwracamy własną wiadomość
    return { error: "Błąd połączenia z serwerem." };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token"); // Niszczymy bilet wstępu
  redirect("/login"); // Wyrzucamy użytkownika do formularza
}
