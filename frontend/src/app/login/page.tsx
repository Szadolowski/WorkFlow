"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth.actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-card text-card-foreground p-10 shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            WorkFlow
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Zaloguj się do systemu kadrowego
          </p>
        </div>

        <form action={formAction} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Adres e-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="relative block w-full appearance-none rounded-md border border-input px-3 py-2 text-foreground placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Adres e-mail"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Hasło
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full appearance-none rounded-md border border-input px-3 py-2 text-foreground placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Hasło"
              />
            </div>
          </div>

          {state?.error && (
            <p className="text-sm text-red-600 text-center">{state.error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Logowanie..." : "Zaloguj się"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
