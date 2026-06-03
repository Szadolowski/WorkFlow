"use server";

import { serverFetch } from "@/lib/api-client";
import type {
  PendingTimeEntriesResponse,
  TimeEntrySingleResponse,
  UpdateTimeEntryStatusPayload,
} from "@/types/time-entries";

export async function getPendingTimeEntriesAction(
  facilityId?: string,
): Promise<PendingTimeEntriesResponse> {
  const params = new URLSearchParams();

  if (facilityId) {
    params.set("facilityId", facilityId);
  }

  const url = `/time-entries/pending${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const res = await serverFetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));

    throw new Error(
      err.message || "Nie udało się pobrać oczekujących wpisów czasu pracy.",
    );
  }

  return res.json();
}

export async function updateTimeEntryStatusAction(
  id: string,
  payload: UpdateTimeEntryStatusPayload,
): Promise<TimeEntrySingleResponse> {
  const res = await serverFetch(`/time-entries/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));

    throw new Error(
      err.message || "Nie udało się zmienić statusu wpisu czasu pracy.",
    );
  }

  return res.json();
}
