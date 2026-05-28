"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardSummaryAction } from "@/app/actions/dashboard.actions";
import { useFacility } from "@/hooks/useFacility";

export function useDashboardSummary() {
  const { activeFacilityId } = useFacility();

  return useQuery({
    // queryKey jest jak podpis. Jak zmieni się ID zakładu, Query pobierze nowe dane.
    queryKey: ["dashboardSummary", activeFacilityId],
    // Wywołujemy naszą bezpieczną akcję serwerową, przekazując ID zakładu
    queryFn: () => getDashboardSummaryAction(activeFacilityId),
    staleTime: 1000 * 60 * 2, // Przez 2 minuty dane są traktowane jako "świeże"
  });
}
