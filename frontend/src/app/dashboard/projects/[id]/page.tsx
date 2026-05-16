"use client";

import { use, useState, useEffect } from "react";
import {
  useAssignEmployeesMutation,
  useProjectDetailsQuery,
} from "@/hooks/useProjects";
import { useEmployeesQuery } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type Assignment = {
  employee: Employee;
};

export default function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const { data: employeesData, isLoading: isLoadingEmployees } =
    useEmployeesQuery();
  const { data: projectDetails, isLoading: isLoadingProject } =
    useProjectDetailsQuery(projectId);

  const assignMutation = useAssignEmployeesMutation(projectId);

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  useEffect(() => {
    // Odwołujemy się do poprawnej nazwy: assignments
    if (projectDetails?.assignments) {
      const activeIds = projectDetails.assignments.map(
        (assignment: Assignment) => assignment.employee.id,
      );

      // Wyłączamy restrykcyjne reguły lintera dla tej konkretnej linii

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedEmployeeIds(activeIds);
    }
  }, [projectDetails]);

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId],
    );
  };

  const handleSaveAssignments = async () => {
    try {
      await assignMutation.mutateAsync({ employeeIds: selectedEmployeeIds });
    } catch (error) {
      console.error("Błąd podczas przypisywania", error);
    }
  };

  if (isLoadingProject || isLoadingEmployees) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const allEmployees: Employee[] = employeesData?.data || [];
  // Pobieramy assignments zamiast EmployeeAssignment
  const activeAssignments: Assignment[] = projectDetails?.assignments || [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Panel Dyspozytora</h1>
        <p className="text-muted-foreground">
          Budowa: {projectDetails?.name} ({projectDetails?.internalCode})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lewa kolumna: Aktualna obsada */}
        <div className="border p-5 rounded-lg shadow-sm bg-card">
          <h2 className="font-semibold text-lg mb-4 text-primary">
            Obecnie przypisani
          </h2>
          {activeAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Brak pracowników na tej budowie.
            </p>
          ) : (
            <ul className="space-y-3">
              {activeAssignments.map((assignment: Assignment) => (
                <li
                  key={assignment.employee.id}
                  className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded-md border"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="font-medium">
                    {assignment.employee.firstName}{" "}
                    {assignment.employee.lastName}
                  </span>
                  <span className="text-muted-foreground text-xs ml-auto">
                    ({assignment.employee.role})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Prawa kolumna: Zarządzanie (Lista z checkboxami) */}
        <div className="border p-5 rounded-lg shadow-sm bg-card flex flex-col">
          <h2 className="font-semibold text-lg mb-4">Zarządzaj obsadą</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Zaznacz pracowników, którzy mają być na tej budowie. Odznaczenie
            usunie ich z projektu.
          </p>

          <div className="flex-1 overflow-y-auto max-h-100 space-y-3 pr-2 mb-6">
            {allEmployees.map((employee: Employee) => (
              <label
                key={employee.id}
                className="flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <Checkbox
                  checked={selectedEmployeeIds.includes(employee.id)}
                  onCheckedChange={() => toggleEmployee(employee.id)}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {employee.firstName} {employee.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {employee.email}
                  </span>
                </div>
              </label>
            ))}
          </div>

          <Button
            onClick={handleSaveAssignments}
            disabled={assignMutation.isPending}
            className="w-full mt-auto"
          >
            {assignMutation.isPending
              ? "Zapisywanie w tle..."
              : "Zapisz zmiany w obsadzie"}
          </Button>
        </div>
      </div>
    </div>
  );
}
