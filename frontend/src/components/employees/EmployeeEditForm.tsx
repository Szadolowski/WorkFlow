"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, X } from "lucide-react";
import { updateEmployeeAction } from "@/app/actions/employees.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UpdateEmployeePayload } from "@/types/employees";

type EditableEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  pesel: string | null;
  email: string | null;
  rfidCardId?: string | null;
};

type EmployeeEditFormState = {
  firstName: string;
  lastName: string;
  pesel: string;
  email: string;
  rfidCardId: string;
};

export function EmployeeEditForm({
  employee,
  activeFacilityId,
  onCancel,
  onSaved,
}: {
  employee: EditableEmployee;
  activeFacilityId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<EmployeeEditFormState>({
    firstName: employee.firstName,
    lastName: employee.lastName,
    pesel: employee.pesel || "",
    email: employee.email || "",
    rfidCardId: employee.rfidCardId || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    if (!form.firstName.trim()) {
      setError("Imię jest wymagane.");
      return;
    }

    if (!form.lastName.trim()) {
      setError("Nazwisko jest wymagane.");
      return;
    }

    if (form.pesel.trim() && !/^\d{11}$/.test(form.pesel.trim())) {
      setError("PESEL musi mieć dokładnie 11 cyfr.");
      return;
    }

    const payload: UpdateEmployeePayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      pesel: form.pesel.trim() || undefined,
      email: form.email.trim() || undefined,
      rfidCardId: form.rfidCardId.trim() || undefined,
    };

    setIsSaving(true);

    try {
      await updateEmployeeAction(employee.id, payload, activeFacilityId);

      await queryClient.invalidateQueries({
        queryKey: ["employeeProfile"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["employees"],
      });

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się zaktualizować danych pracownika.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Edycja danych pracownika</h2>
        <p className="text-sm text-muted-foreground">
          Ten formularz edytuje tylko dane kadrowe. Nie zmienia roli, hasła ani
          dostępu do systemu.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Imię</label>
          <Input
            value={form.firstName}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                firstName: event.target.value,
              }))
            }
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Nazwisko</label>
          <Input
            value={form.lastName}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                lastName: event.target.value,
              }))
            }
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">PESEL</label>
          <Input
            value={form.pesel}
            maxLength={11}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                pesel: event.target.value,
              }))
            }
            placeholder="11 cyfr"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">E-mail</label>
          <Input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                email: event.target.value,
              }))
            }
            placeholder="pracownik@firma.pl"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Karta RFID</label>
          <Input
            value={form.rfidCardId}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                rfidCardId: event.target.value,
              }))
            }
            placeholder="np. CARD-000123"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
        </Button>

        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          <X className="mr-2 h-4 w-4" />
          Anuluj
        </Button>
      </div>
    </div>
  );
}
