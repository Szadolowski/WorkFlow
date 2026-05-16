"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateProjectMutation } from "@/hooks/useProjects";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// 1. Definiujemy walidację zgodną z naszym backendowym DTO
const formSchema = z.object({
  name: z.string().min(3, "Nazwa musi mieć co najmniej 3 znaki"),
  internalCode: z.string().min(3, "Kod musi mieć co najmniej 3 znaki"),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const createProject = useCreateProjectMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      internalCode: "",
      address: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createProject.mutateAsync(data);
      form.reset(); // Czyszczenie formularza po sukcesie
      setOpen(false); // Zamykamy modal
    } catch (error) {
      // Wyłapanie np. błędu o duplikacie internalCode z NestJS
      if (error instanceof Error) {
        form.setError("internalCode", { message: error.message });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Dodaj nowy projekt</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Utwórz nowy projekt</DialogTitle>
          <DialogDescription>
            Wypełnij dane nowej budowy. Kod wewnętrzny musi być unikalny.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa budowy</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Budowa Osiedla X" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="internalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kod wewnętrzny</FormLabel>
                  <FormControl>
                    <Input placeholder="np. BUD-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adres (opcjonalnie)</FormLabel>
                  <FormControl>
                    <Input placeholder="np. ul. Długa 5, Warszawa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={createProject.isPending}
            >
              {createProject.isPending ? "Zapisywanie..." : "Zapisz projekt"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
