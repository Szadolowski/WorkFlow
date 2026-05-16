"use client";
import CreateProjectDialog from "@/components/projects/CreateProjectDialog";
import { useActiveProjectsQuery } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// 1. Dodajemy typowanie dla projektu z bazy danych
type Project = {
  id: string;
  name: string;
  internalCode: string;
  address: string | null;
};

export default function ProjectsPage() {
  const { data: projects, isLoading, isError } = useActiveProjectsQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-500">
        Wystąpił błąd podczas pobierania projektów.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Aktywne Budowy</h1>
        <CreateProjectDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 2. Mapujemy projekty z użyciem komponentu Link */}
        {projects?.map((project: Project) => (
          <Link href={`/dashboard/projects/${project.id}`} key={project.id}>
            <div className="border p-4 rounded-lg shadow-sm bg-card text-card-foreground hover:bg-slate-50 cursor-pointer transition-colors h-full">
              <h2 className="font-semibold text-lg">{project.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Kod: {project.internalCode}
              </p>
              <p className="text-sm text-muted-foreground">
                Adres: {project.address || "Brak adresu"}
              </p>
            </div>
          </Link>
        ))}

        {projects?.length === 0 && (
          <p className="text-muted-foreground">
            Brak aktywnych projektów w bazie.
          </p>
        )}
      </div>
    </div>
  );
}
