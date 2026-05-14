import { redirect } from "next/navigation";
// Używamy bezpiecznych ścieżek relatywnych, jeśli alias @/ sprawia problemy
import { serverFetch } from "../../lib/api-client";
import { logoutAction } from "../actions/auth.actions";

export default async function DashboardPage() {
  let profileData = null;

  try {
    const res = await serverFetch("/auth/me");
    const data = await res.json();
    profileData = data.user;
  } catch {
    // USUNIĘTO '(error)'.
    // Jeśli serverFetch rzuci błędem (np. brak ciastka lub wygasło po 8h)
    // Zmienna profileData pozostanie null, co spowoduje przekierowanie niżej
  }

  // Wczesne wyjście - ochrona ścieżki
  if (!profileData) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Panel Główny WorkFlow
          </h1>

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
            >
              Wyloguj się
            </button>
          </form>
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">
            Witaj w systemie!
          </h2>
          <p className="text-gray-600">
            Twój token JWT został pomyślnie przetworzony. Oto dane odkodowane
            przez backend:
          </p>

          <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-green-400">
            <pre>{JSON.stringify(profileData, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
