"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { UserRole } from "@/types/employees";
import {
  useRevokeEmployeeAccessMutation,
  useUpdateEmployeeAccessMutation,
} from "@/hooks/useEmployees";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const accessFormSchema = z.object({
  role: z.enum(["ADMIN", "HR", "OFFICE", "FOREMAN", "ACCOUNTING", "WORKER"]),
  temporaryPassword: z
    .string()
    .min(8, "Hasło tymczasowe musi mieć co najmniej 8 znaków"),
});

type EmployeeAccessDialogProps = {
  employeeId: string;
  currentRole: UserRole;
  isLoginEnabled: boolean;
};

export default function EmployeeAccessDialog({
  employeeId,
  currentRole,
  isLoginEnabled,
}: EmployeeAccessDialogProps) {
  const [open, setOpen] = useState(false);
  const mutation = useUpdateEmployeeAccessMutation();

  const revokeMutation = useRevokeEmployeeAccessMutation();

  const form = useForm<z.infer<typeof accessFormSchema>>({
    resolver: zodResolver(accessFormSchema),
    defaultValues: {
      role: currentRole,
      temporaryPassword: "",
    },
  });

  async function handleRevokeAccess() {
    const confirmed = window.confirm(
      "Czy na pewno chcesz odebrać temu pracownikowi dostęp do systemu?",
    );

    if (!confirmed) return;

    try {
      await revokeMutation.mutateAsync(employeeId);
      setOpen(false);
    } catch (error) {
      form.setError("root", {
        message: (error as Error).message || "Nie udało się odebrać dostępu.",
      });
    }
  }

  async function onSubmit(values: z.infer<typeof accessFormSchema>) {
    try {
      await mutation.mutateAsync({
        employeeId,
        data: values,
      });

      form.reset({
        role: values.role,
        temporaryPassword: "",
      });
      setOpen(false);
    } catch (error) {
      form.setError("root", {
        message: (error as Error).message || "Wystąpił błąd",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isLoginEnabled ? "outline" : "default"}
          size="sm"
          onClick={(event) => event.stopPropagation()}
        >
          {isLoginEnabled ? "Zmień dostęp" : "Aktywuj dostęp"}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>
            {isLoginEnabled ? "Zmień dostęp pracownika" : "Aktywuj dostęp"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rola w systemie</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz rolę" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="WORKER">Pracownik</SelectItem>
                      <SelectItem value="FOREMAN">Brygadzista</SelectItem>
                      <SelectItem value="OFFICE">Biuro</SelectItem>
                      <SelectItem value="HR">Kadry HR</SelectItem>
                      <SelectItem value="ACCOUNTING">Księgowość</SelectItem>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="temporaryPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasło tymczasowe</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Minimum 8 znaków"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Hasło tymczasowe zostanie zapisane wyłącznie jako hash. Nie będzie
              zwracane w odpowiedzi API.
            </div>

            {form.formState.errors.root && (
              <div className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            {isLoginEnabled && (
              <Button
                type="button"
                variant="destructive"
                disabled={revokeMutation.isPending}
                onClick={handleRevokeAccess}
              >
                {revokeMutation.isPending ? "Odbieranie..." : "Odbierz dostęp"}
              </Button>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Zapisywanie..." : "Zapisz dostęp"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
