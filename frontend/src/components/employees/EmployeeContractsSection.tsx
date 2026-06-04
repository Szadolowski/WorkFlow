"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, FileText, Plus } from "lucide-react";
import {
  createEmployeeContractAction,
  getEmployeeContractsAction,
} from "@/app/actions/contracts.actions";
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
  ContractType,
  CreateEmployeeContractPayload,
  EmployeeContract,
} from "@/types/contracts";

type CurrentContractLike = {
  id: string;
  type: ContractType;
  salaryAmount: string | number;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
} | null;

type ContractFormState = {
  type: ContractType;
  salaryAmount: string;
  startDate: string;
  endDate: string;
};

const emptyForm: ContractFormState = {
  type: "UOP",
  salaryAmount: "",
  startDate: "",
  endDate: "",
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("pl-PL");
}

function formatMoney(value: string | number) {
  return Number(value).toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
  });
}

function getAmountLabel(type: ContractType) {
  if (type === "UZ" || type === "B2B") {
    return "Stawka godzinowa";
  }

  return "Wynagrodzenie";
}

export function EmployeeContractsSection({
  employeeId,
  activeFacilityId,
  currentContract,
  canManageContracts,
}: {
  employeeId: string;
  activeFacilityId: string;
  currentContract: CurrentContractLike;
  canManageContracts: boolean;
}) {
  const queryClient = useQueryClient();

  const [contracts, setContracts] = useState<EmployeeContract[]>([]);
  const [form, setForm] = useState<ContractFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshContracts() {
    if (!canManageContracts) {
      return;
    }

    const response = await getEmployeeContractsAction(
      employeeId,
      activeFacilityId,
    );

    setContracts(response.data);
  }

  useEffect(() => {
    if (!canManageContracts) {
      return;
    }

    let isCancelled = false;

    getEmployeeContractsAction(employeeId, activeFacilityId)
      .then((response) => {
        if (isCancelled) return;

        setContracts(response.data);
        setError(null);
      })
      .catch((err) => {
        if (isCancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Nie udało się pobrać historii umów.",
        );
      });

    return () => {
      isCancelled = true;
    };
  }, [activeFacilityId, canManageContracts, employeeId]);

  async function handleCreateContract() {
    setError(null);

    const salaryAmount = Number(form.salaryAmount);

    if (!form.startDate) {
      setError("Data rozpoczęcia umowy jest wymagana.");
      return;
    }

    if (!Number.isFinite(salaryAmount) || salaryAmount < 0) {
      setError("Kwota lub stawka musi być poprawną liczbą.");
      return;
    }

    const payload: CreateEmployeeContractPayload = {
      type: form.type,
      salaryAmount,
      startDate: form.startDate,
      ...(form.endDate ? { endDate: form.endDate } : {}),
    };

    setIsSaving(true);

    try {
      await createEmployeeContractAction(employeeId, payload, activeFacilityId);
      await refreshContracts();

      await queryClient.invalidateQueries({
        queryKey: ["employeeProfile"],
      });

      setForm(emptyForm);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się dodać umowy.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const visibleContracts =
    contracts.length > 0
      ? contracts
      : currentContract
        ? [
            {
              id: currentContract.id,
              employeeId,
              type: currentContract.type,
              salaryAmount: String(currentContract.salaryAmount),
              startDate: currentContract.startDate,
              endDate: currentContract.endDate,
              isCurrent: currentContract.isCurrent,
              createdAt: "",
              updatedAt: null,
            },
          ]
        : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="w-5 h-5 text-primary" />
          Umowy
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {!currentContract ? (
          <p className="text-muted-foreground text-sm">
            Pracownik nie posiada aktualnej umowy wpisanej do systemu.
          </p>
        ) : (
          <div className="p-4 border rounded-md bg-muted/50 grid grid-cols-2 gap-y-4 dark:bg-slate-900">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Rodzaj umowy
              </p>
              <p className="font-semibold">{currentContract.type}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {getAmountLabel(currentContract.type)}
              </p>
              <p className="font-semibold">
                {formatMoney(currentContract.salaryAmount)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Od kiedy
              </p>
              <p>{formatDate(currentContract.startDate)}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Do kiedy
              </p>
              <p>
                {currentContract.endDate
                  ? formatDate(currentContract.endDate)
                  : "Czas nieokreślony"}
              </p>
            </div>
          </div>
        )}

        {canManageContracts && (
          <div className="rounded-md border p-4 space-y-4">
            <div className="flex items-center gap-2 font-medium">
              <Plus className="h-4 w-4" />
              Dodaj nową umowę
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Typ umowy
                </label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      type: value as ContractType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Typ umowy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UOP">UOP</SelectItem>
                    <SelectItem value="UZ">UZ</SelectItem>
                    <SelectItem value="UD">UD</SelectItem>
                    <SelectItem value="B2B">B2B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Kwota / stawka
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.salaryAmount}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      salaryAmount: event.target.value,
                    }))
                  }
                  placeholder="np. 7234 lub 55"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Data od
                </label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      startDate: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Data do
                </label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      endDate: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <Button onClick={handleCreateContract} disabled={isSaving}>
              {isSaving ? "Zapisywanie..." : "Dodaj umowę"}
            </Button>

            <p className="text-xs text-muted-foreground">
              Dodanie nowej umowy automatycznie zamyka poprzednią aktualną umowę
              pracownika.
            </p>
          </div>
        )}

        {canManageContracts && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <BriefcaseBusiness className="h-4 w-4" />
              Historia umów
            </div>

            {visibleContracts.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Brak historii umów.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Typ</th>
                      <th className="px-4 py-3 font-medium">Kwota / stawka</th>
                      <th className="px-4 py-3 font-medium">Od</th>
                      <th className="px-4 py-3 font-medium">Do</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleContracts.map((contract) => (
                      <tr key={contract.id} className="border-t">
                        <td className="px-4 py-3">{contract.type}</td>
                        <td className="px-4 py-3">
                          {formatMoney(contract.salaryAmount)}
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(contract.startDate)}
                        </td>
                        <td className="px-4 py-3">
                          {contract.endDate
                            ? formatDate(contract.endDate)
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {contract.isCurrent ? (
                            <span className="font-medium text-green-600">
                              Aktualna
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Zamknięta
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
