"use client";

import { useEffect, useState } from "react";
import { Building2, Pencil, Plus, Power, Users } from "lucide-react";
import {
  createFacilityAction,
  getFacilitiesAction,
  updateFacilityAction,
} from "@/app/actions/facilities.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  CreateFacilityPayload,
  FacilityListItem,
} from "@/types/facilities";
import Link from "next/link";

type FacilityFormState = {
  name: string;
  code: string;
  address: string;
};

const emptyForm: FacilityFormState = {
  name: "",
  code: "",
  address: "",
};

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [form, setForm] = useState<FacilityFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadFacilities() {
    setError(null);
    setIsLoading(true);

    try {
      const response = await getFacilitiesAction();
      setFacilities(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się pobrać listy zakładów.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isCancelled = false;

    getFacilitiesAction()
      .then((response) => {
        if (isCancelled) return;

        setFacilities(response.data);
        setError(null);
      })
      .catch((err) => {
        if (isCancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Nie udało się pobrać listy zakładów.",
        );
      })
      .finally(() => {
        if (isCancelled) return;

        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function startEdit(facility: FacilityListItem) {
    setEditingId(facility.id);
    setForm({
      name: facility.name,
      code: facility.code || "",
      address: facility.address || "",
    });
    setError(null);
  }

  async function handleSubmit() {
    setError(null);

    const payload: CreateFacilityPayload = {
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      address: form.address.trim() || undefined,
    };

    if (!payload.name) {
      setError("Nazwa zakładu jest wymagana.");
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        await updateFacilityAction(editingId, payload);
      } else {
        await createFacilityAction(payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadFacilities();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się zapisać zakładu.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(facility: FacilityListItem) {
    setProcessingId(facility.id);
    setError(null);

    try {
      await updateFacilityAction(facility.id, {
        isActive: !facility.isActive,
      });

      await loadFacilities();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się zmienić statusu zakładu.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Zakłady</h1>
        <p className="text-muted-foreground">
          Zarządzanie strukturą organizacyjną firmy.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingId ? "Edycja zakładu" : "Dodaj zakład"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Nazwa</label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="np. Centrala Warszawa"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Kod</label>
              <Input
                value={form.code}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, code: event.target.value }))
                }
                placeholder="np. WAW-01"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Adres</label>
              <Input
                value={form.address}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, address: event.target.value }))
                }
                placeholder="np. ul. Złota 44"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving
                ? "Zapisywanie..."
                : editingId
                  ? "Zapisz zmiany"
                  : "Dodaj zakład"}
            </Button>

            {editingId && (
              <Button variant="outline" onClick={startCreate}>
                Anuluj edycję
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Lista zakładów
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Ładowanie zakładów...
            </div>
          ) : facilities.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Brak zakładów w systemie.
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="min-w-245 w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Nazwa</th>
                      <th className="px-4 py-3 font-medium">Kod</th>
                      <th className="px-4 py-3 font-medium">Adres</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Pracownicy</th>
                      <th className="px-4 py-3 font-medium">Projekty</th>
                      <th className="px-4 py-3 font-medium">Czytniki</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Akcje
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {facilities.map((facility) => (
                      <tr key={facility.id} className="border-t">
                        <td className="px-4 py-3 font-medium">
                          {facility.name}
                        </td>
                        <td className="px-4 py-3">{facility.code || "—"}</td>
                        <td className="px-4 py-3">{facility.address || "—"}</td>
                        <td className="px-4 py-3">
                          {facility.isActive ? (
                            <span className="text-green-600 font-medium">
                              Aktywny
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              Nieaktywny
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {facility._count.employees}
                        </td>
                        <td className="px-4 py-3">
                          {facility._count.projects}
                        </td>
                        <td className="px-4 py-3">{facility._count.readers}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(facility)}
                            >
                              <Pencil className="mr-1 h-4 w-4" />
                              Edytuj
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processingId === facility.id}
                              onClick={() => toggleActive(facility)}
                            >
                              <Power className="mr-1 h-4 w-4" />
                              {facility.isActive ? "Dezaktywuj" : "Aktywuj"}
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link
                                href={`/dashboard/facilities/${facility.id}/employees`}
                              >
                                <Users className="mr-1 h-4 w-4" />
                                Pracownicy
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
