"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardSummaryAction } from "@/app/actions/dashboard.actions";
import { useFacility } from "@/hooks/useFacility";

export function useDashboardSummaryQuery() {
  const { activeFacilityId } = useFacility();

  return useQuery({
    // queryKey jest jak podpis. Jak zmieni się activeFacilityId, React Query wywoła funkcję ponownie!
    queryKey: ["dashboardSummary", activeFacilityId],
    queryFn: () => getDashboardSummaryAction(activeFacilityId),
    staleTime: 1000 * 60 * 2, // Przez 2 minuty dane uważamy za "świeże" (nie uderzamy po cichu do API)
  });
}
