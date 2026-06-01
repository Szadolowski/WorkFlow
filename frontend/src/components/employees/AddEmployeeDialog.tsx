"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateEmployeeMutation } from "@/hooks/useEmployees";

// Komponenty shadcn/ui
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
import { isValidPesel } from "@/lib/utils";
import { useFacility } from "@/hooks/useFacility";

const formSchema = z.object({
  firstName: z.string().min(2, "Imię musi mieć min. 2 znaki"),
  lastName: z.string().min(2, "Nazwisko musi mieć min. 2 znaki"),
  pesel: z
    .string()
    .length(11, "PESEL musi składać się dokładnie z 11 cyfr")
    .regex(/^\d+$/, "PESEL nie może zawierać liter ani znaków specjalnych")
    .refine(isValidPesel, "Niepoprawny numer PESEL"),
  email: z.string().email("Niepoprawny format adresu e-mail"),
  facilityId: z.string().uuid("Wybierz zakład dla pracownika"),
});

export default function AddEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const mutation = useCreateEmployeeMutation();
  const { facilities, activeFacilityId } = useFacility();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      pesel: "",
      email: "",
      facilityId: activeFacilityId,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { facilityId, ...employeeData } = values;

      await mutation.mutateAsync({
        data: employeeData,
        facilityId,
      });

      form.reset({
        firstName: "",
        lastName: "",
        pesel: "",
        email: "",
        facilityId,
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
        <Button>Dodaj pracownika</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Dodaj nowego pracownika</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Imię */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imię</FormLabel>
                    <FormControl>
                      <Input placeholder="Jan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Nazwisko */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwisko</FormLabel>
                    <FormControl>
                      <Input placeholder="Kowalski" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* PESEL */}
            <FormField
              control={form.control}
              name="pesel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PESEL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="00000000000"
                      maxLength={11}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adres e-mail</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="jan.kowalski@firma.pl"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="facilityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zakład</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz zakład" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {facilities.map((facility) => (
                        <SelectItem key={facility.id} value={facility.id}>
                          {facility.name}
                          {facility.code ? ` (${facility.code})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rola (Select) */}
            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Pracownik zostanie dodany do ewidencji bez aktywnego konta
              logowania. Dostęp do systemu i rola mogą zostać skonfigurowane
              osobno przez administratora.
            </div>

            {/* Błąd z serwera (np. konflikt PESEL/Email) */}
            {form.formState.errors.root && (
              <div className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Zapisywanie..." : "Zapisz pracownika"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
