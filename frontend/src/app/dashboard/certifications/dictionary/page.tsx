"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, Pencil, Plus, Power, Search } from "lucide-react";
import {
  createCertificationDictionaryAction,
  getCertificationDictionaryAction,
  updateCertificationDictionaryAction,
} from "@/app/actions/certifications.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CertificationDictionaryItem,
  CertificationType,
  CreateCertificationDictionaryPayload,
} from "@/types/certifications";

type DictionaryFormState = {
  type: CertificationType;
  name: string;
  description: string;
  defaultValidityMonths: string;
};

const emptyForm: DictionaryFormState = {
  type: "BHP",
  name: "",
  description: "",
  defaultValidityMonths: "",
};

function normalizeSearchValue(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getTypeLabel(type: CertificationType) {
  switch (type) {
    case "BHP":
      return "BHP";
    case "MEDICAL":
      return "Badania lekarskie";
    case "UDT":
      return "UDT";
    case "OTHER":
      return "Inne";
    default:
      return type;
  }
}

export default function CertificationDictionaryPage() {
  const [items, setItems] = useState<CertificationDictionaryItem[]>([]);
  const [form, setForm] = useState<DictionaryFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadDictionary() {
    setError(null);
    setIsLoading(true);

    try {
      const response = await getCertificationDictionaryAction();
      setItems(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się pobrać słownika certyfikacji.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isCancelled = false;

    getCertificationDictionaryAction()
      .then((response) => {
        if (isCancelled) return;

        setItems(response.data);
        setError(null);
      })
      .catch((err) => {
        if (isCancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Nie udało się pobrać słownika certyfikacji.",
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

  const visibleItems = useMemo(() => {
    const query = normalizeSearchValue(searchQuery.trim());

    if (!query) {
      return items;
    }

    return items.filter((item) => {
      const searchableValue = [
        item.type,
        getTypeLabel(item.type),
        item.name,
        item.description,
        item.defaultValidityMonths?.toString(),
        item.isActive ? "aktywny" : "nieaktywny",
      ]
        .map(normalizeSearchValue)
        .join(" ");

      return searchableValue.includes(query);
    });
  }, [items, searchQuery]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function startEdit(item: CertificationDictionaryItem) {
    setEditingId(item.id);
    setForm({
      type: item.type,
      name: item.name,
      description: item.description || "",
      defaultValidityMonths: item.defaultValidityMonths
        ? String(item.defaultValidityMonths)
        : "",
    });
    setError(null);
  }

  async function handleSubmit() {
    setError(null);

    const defaultValidityMonths = form.defaultValidityMonths
      ? Number(form.defaultValidityMonths)
      : undefined;

    if (!form.name.trim()) {
      setError("Nazwa pozycji słownika jest wymagana.");
      return;
    }

    if (
      defaultValidityMonths !== undefined &&
      (!Number.isInteger(defaultValidityMonths) || defaultValidityMonths < 1)
    ) {
      setError("Domyślna ważność musi być liczbą całkowitą większą od 0.");
      return;
    }

    const payload: CreateCertificationDictionaryPayload = {
      type: form.type,
      name: form.name.trim(),
      ...(form.description.trim()
        ? { description: form.description.trim() }
        : {}),
      ...(defaultValidityMonths ? { defaultValidityMonths } : {}),
    };

    setIsSaving(true);

    try {
      if (editingId) {
        await updateCertificationDictionaryAction(editingId, payload);
      } else {
        await createCertificationDictionaryAction(payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadDictionary();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się zapisać pozycji słownika.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(item: CertificationDictionaryItem) {
    setProcessingId(item.id);
    setError(null);

    try {
      await updateCertificationDictionaryAction(item.id, {
        isActive: !item.isActive,
      });

      await loadDictionary();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się zmienić statusu pozycji słownika.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Słownik certyfikacji
        </h1>
        <p className="text-muted-foreground">
          Zarządzanie typami szkoleń, badań i uprawnień używanych w profilach
          pracowników.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingId ? "Edycja pozycji słownika" : "Dodaj pozycję słownika"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Typ</label>
              <Select
                value={form.type}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    type: value as CertificationType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BHP">BHP</SelectItem>
                  <SelectItem value="MEDICAL">Badania lekarskie</SelectItem>
                  <SelectItem value="UDT">UDT</SelectItem>
                  <SelectItem value="OTHER">Inne</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Nazwa</label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="np. Szkolenie BHP podstawowe"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Ważność domyślna
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.defaultValidityMonths}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    defaultValidityMonths: event.target.value,
                  }))
                }
                placeholder="np. 12"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Opis</label>
              <Input
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Opcjonalny opis"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving
                ? "Zapisywanie..."
                : editingId
                  ? "Zapisz zmiany"
                  : "Dodaj pozycję"}
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
            <BookOpenCheck className="h-5 w-5" />
            Lista pozycji słownika
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Szukaj po nazwie, typie, opisie lub statusie..."
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Ładowanie słownika...
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Brak pozycji pasujących do wyszukiwania.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nazwa</th>
                    <th className="px-4 py-3 font-medium">Typ</th>
                    <th className="px-4 py-3 font-medium">Ważność</th>
                    <th className="px-4 py-3 font-medium">Opis</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Akcje</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleItems.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3">{getTypeLabel(item.type)}</td>
                      <td className="px-4 py-3">
                        {item.defaultValidityMonths
                          ? `${item.defaultValidityMonths} mies.`
                          : "Brak"}
                      </td>
                      <td className="px-4 py-3">{item.description || "—"}</td>
                      <td className="px-4 py-3">
                        {item.isActive ? (
                          <span className="font-medium text-green-600">
                            Aktywna
                          </span>
                        ) : (
                          <span className="font-medium text-red-600">
                            Nieaktywna
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(item)}
                          >
                            <Pencil className="mr-1 h-4 w-4" />
                            Edytuj
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processingId === item.id}
                            onClick={() => toggleActive(item)}
                          >
                            <Power className="mr-1 h-4 w-4" />
                            {item.isActive ? "Dezaktywuj" : "Aktywuj"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
