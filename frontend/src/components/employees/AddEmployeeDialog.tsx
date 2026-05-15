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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 1. Definicja schematu walidacji Zod (lustrzane odbicie naszego DTO z backendu)
const formSchema = z.object({
  firstName: z.string().min(2, "Imię musi mieć min. 2 znaki"),
  lastName: z.string().min(2, "Nazwisko musi mieć min. 2 znaki"),
  pesel: z.string().length(11, "PESEL musi składać się dokładnie z 11 cyfr"),
  email: z.string().email("Niepoprawny format adresu e-mail"),
  role: z.enum(["ADMIN", "HR", "OFFICE", "FOREMAN", "ACCOUNTING", "WORKER"]),
});

export default function AddEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const mutation = useCreateEmployeeMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      pesel: "",
      email: "",
      role: "WORKER",
    },
  });

  // 2. Bezpieczne łapanie błędu bez słowa "any" (wymóg ESLinta)
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await mutation.mutateAsync(values);
      form.reset();
      setOpen(false);
    } catch (error) {
      // Rzutujemy error na typ Error w locie
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

            {/* Rola (Select) */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rola w systemie</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz rolę" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="WORKER">Pracownik Fizyczny</SelectItem>
                      <SelectItem value="FOREMAN">Brygadzista</SelectItem>
                      <SelectItem value="OFFICE">Biuro</SelectItem>
                      <SelectItem value="HR">Kadry (HR)</SelectItem>
                      <SelectItem value="ACCOUNTING">Księgowość</SelectItem>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
