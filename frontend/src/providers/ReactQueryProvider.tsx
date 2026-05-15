"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Tworzymy instancję QueryClienta raz na cykl życia komponentu klienta
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Dane są traktowane jako "świeże" przez 1 minutę
            refetchOnWindowFocus: false, // Wyłączamy agresywne odświeżanie po przełączeniu kart przeglądarki
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
