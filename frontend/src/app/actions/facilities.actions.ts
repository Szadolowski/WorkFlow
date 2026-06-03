"use server";

import { serverFetch } from "@/lib/api-client";
import type {
  CreateFacilityPayload,
  FacilitiesResponse,
  FacilitySingleResponse,
  UpdateFacilityPayload,
} from "@/types/facilities";

export async function getFacilitiesAction(): Promise<FacilitiesResponse> {
  const res = await serverFetch("/facilities");

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Nie udało się pobrać listy zakładów.");
  }

  return res.json();
}

export async function createFacilityAction(
  payload: CreateFacilityPayload,
): Promise<FacilitySingleResponse> {
  const res = await serverFetch("/facilities", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Nie udało się dodać zakładu.");
  }

  return res.json();
}

export async function updateFacilityAction(
  id: string,
  payload: UpdateFacilityPayload,
): Promise<FacilitySingleResponse> {
  const res = await serverFetch(`/facilities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Nie udało się zaktualizować zakładu.");
  }

  return res.json();
}
