"use client";

import { useState, use } from "react";
import { useEmployeeProfileQuery } from "@/hooks/useEmployees";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Briefcase,
  FileText,
  Award,
  CalendarOff,
  FolderOpen,
  ShieldAlert,
  Download,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/shared/FileUpload";
import { useFacility } from "@/hooks/useFacility";
import {
  getEmployeeDocumentDownloadUrlAction,
  getEmployeeDocumentUploadUrlAction,
} from "@/app/actions/storage.actions";
import { addDocumentAction } from "@/app/actions/employees.actions";

// Definicje typów, aby uciszyć linter
type Assignment = {
  id: string;
  assignedAt: Date;
  project: {
    name: string;
    internalCode: string | null;
    status: string;
  };
};

type EmployeeDocument = {
  id: string;
  employeeId: string;
  fileName: string;
  fileUrl: string;
  createdAt: string;
};

type Certification = {
  id: string;
  certificateNumber: string | null;
  issuedAt: Date;
  expiresAt: Date;
  dictionary: {
    name: string;
    type: string;
  };
};

export default function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;

  const { activeFacilityId } = useFacility();
  const [docCategory, setDocCategory] = useState("Ogólny");
  const [customFileName, setCustomFileName] = useState(""); // <--- Nowy stan na własną nazwę pliku

  const { data, isLoading, isError, error } =
    useEmployeeProfileQuery(employeeId);

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-100 w-full" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[50vh] text-destructive">
        <ShieldAlert className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold">Błąd wczytywania profilu</h2>
        <p>{error?.message || "Nie udało się pobrać danych pracownika."}</p>
      </div>
    );
  }

  const employee = data.data;

  const initials =
    `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center gap-6 bg-card p-6 rounded-xl border shadow-sm">
        <Avatar className="w-24 h-24 border-2 border-primary/10">
          <AvatarImage
            src=""
            alt={`${employee.firstName} ${employee.lastName}`}
          />
          <AvatarFallback className="text-2xl font-bold bg-primary/5 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {employee.firstName} {employee.lastName}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="text-sm px-3 py-1 bg-slate-50">
              {employee.role}
            </Badge>
            {employee.isActive ? (
              <Badge className="bg-green-600 hover:bg-green-700 text-sm px-3 py-1">
                Aktywny
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-sm px-3 py-1">
                Nieaktywny
              </Badge>
            )}
            {!employee.validCertifications.length && (
              <Badge variant="destructive" className="text-sm px-3 py-1">
                Brak ważnych badań/szkoleń
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-1 text-sm text-muted-foreground md:text-right">
          <p>
            <strong>PESEL:</strong> {employee.pesel || "Brak danych"}
          </p>
          <p>
            <strong>Email:</strong> {employee.email || "Brak danych"}
          </p>
        </div>
      </div>

      {/* SEKCJA ZAKŁADEK (TABS) */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full lg:w-150 grid-cols-4 mb-6">
          <TabsTrigger value="overview">Podsumowanie</TabsTrigger>
          <TabsTrigger value="certifications">Uprawnienia</TabsTrigger>
          <TabsTrigger value="absences">Nieobecności</TabsTrigger>
          <TabsTrigger value="documents">Dokumenty</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="w-5 h-5 text-primary" /> Obecny projekt
                </CardTitle>
              </CardHeader>
              <CardContent>
                {employee.activeAssignments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Pracownik znajduje się w puli wolnej (nieprzypisany).
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {employee.activeAssignments.map(
                      (assignment: Assignment) => (
                        <li
                          key={assignment.id}
                          className="p-3 border rounded-md bg-slate-50/50"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-base">
                                {assignment.project.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Kod: {assignment.project.internalCode || "Brak"}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {assignment.project.status}
                            </Badge>
                          </div>
                          <p className="text-xs mt-3 text-muted-foreground">
                            Przypisano:{" "}
                            {new Date(assignment.assignedAt).toLocaleDateString(
                              "pl-PL",
                            )}
                          </p>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-primary" /> Aktualna Umowa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!employee.currentContract ? (
                  <p className="text-muted-foreground text-sm">
                    Pracownik nie posiada aktualnej umowy wpisanej do systemu.
                  </p>
                ) : (
                  <div className="p-4 border rounded-md bg-slate-50/50 grid grid-cols-2 gap-y-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Rodzaj umowy
                      </p>
                      <p className="font-semibold">
                        {employee.currentContract.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Wynagrodzenie
                      </p>
                      <p className="font-semibold">
                        {employee.currentContract.salaryAmount} PLN
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Od kiedy
                      </p>
                      <p>
                        {new Date(
                          employee.currentContract.startDate,
                        ).toLocaleDateString("pl-PL")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Do kiedy
                      </p>
                      <p>
                        {employee.currentContract.endDate
                          ? new Date(
                              employee.currentContract.endDate,
                            ).toLocaleDateString("pl-PL")
                          : "Czas nieokreślony"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="certifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" /> Kwalifikacje i
                Badania
              </CardTitle>
              <CardDescription>
                Lista ważnych certyfikatów i szkoleń (BHP, Lekarskie, UDT).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employee.validCertifications.length === 0 ? (
                <div className="text-center p-6 border border-dashed rounded-lg">
                  <p className="text-muted-foreground text-sm">
                    Brak ważnych szkoleń w bazie.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee.validCertifications.map((cert: Certification) => {
                    const daysToExpiry = Math.ceil(
                      (new Date(cert.expiresAt).getTime() -
                        new Date().getTime()) /
                        (1000 * 3600 * 24),
                    );
                    const isExpiringSoon = daysToExpiry <= 30;

                    return (
                      <div
                        key={cert.id}
                        className={`p-4 border rounded-md flex flex-col justify-between ${isExpiringSoon ? "border-orange-200 bg-orange-50/50" : "bg-slate-50/50"}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-semibold">
                              {cert.dictionary.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Nr: {cert.certificateNumber || "Brak numeru"}
                            </p>
                          </div>
                          <Badge
                            variant={
                              cert.dictionary.type === "BHP"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {cert.dictionary.type}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm border-t pt-3">
                          <span className="text-muted-foreground">
                            Wydano:{" "}
                            {new Date(cert.issuedAt).toLocaleDateString(
                              "pl-PL",
                            )}
                          </span>
                          <span
                            className={`font-semibold ${isExpiringSoon ? "text-orange-600" : "text-primary"}`}
                          >
                            Ważne do:{" "}
                            {new Date(cert.expiresAt).toLocaleDateString(
                              "pl-PL",
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="absences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarOff className="w-5 h-5 text-primary" /> Historia
                Nieobecności
              </CardTitle>
              <CardDescription>
                Trwające i nadchodzące urlopy oraz zwolnienia (L4).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-12 text-center border border-dashed rounded-lg bg-slate-50/30">
                <CalendarOff className="w-8 h-8 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm font-medium">
                  Moduł nieobecności w przygotowaniu
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dane o urlopach będą ładowane asynchronicznie (Lazy Loading) w
                  kolejnej iteracji.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" /> Archiwum
                Dokumentów
              </CardTitle>
              <CardDescription>
                Zarządzaj plikami pracownika. Pliki są bezpiecznie transferowane
                do MinIO (S3).
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="p-4 border rounded-lg bg-slate-50/50 space-y-4">
                <h3 className="text-sm font-medium">Dodaj nowy dokument</h3>

                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="w-full sm:w-48">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Kategoria pliku
                    </label>
                    <Select value={docCategory} onValueChange={setDocCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz typ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ogólny">Ogólny dokument</SelectItem>
                        <SelectItem value="Umowa">Umowa</SelectItem>
                        <SelectItem value="Certyfikat">Certyfikat</SelectItem>
                        <SelectItem value="Medyczny">
                          Badania lekarskie
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full sm:w-64">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Nazwa (opcjonalnie)
                    </label>
                    <Input
                      placeholder="np. Skierowanie na badania"
                      value={customFileName}
                      onChange={(e) => setCustomFileName(e.target.value)}
                    />
                  </div>

                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Wybierz plik z dysku
                    </label>
                    <FileUpload
                      getUploadUrl={(fileName) =>
                        getEmployeeDocumentUploadUrlAction(
                          employeeId,
                          fileName,
                          activeFacilityId,
                        )
                      }
                      onUploadSuccess={async (
                        fileKey: string,
                        fileName: string,
                      ) => {
                        const baseName =
                          customFileName.trim() !== ""
                            ? customFileName.trim()
                            : fileName;

                        const finalName = `[${docCategory}] ${baseName}`;

                        await addDocumentAction(employeeId, finalName, fileKey);

                        setCustomFileName("");
                        alert("Sukces! Dokument zapisany w bazie.");
                        window.location.reload();
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                  Wgrane dokumenty
                </h3>

                {employee.documents && employee.documents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {employee.documents.map((doc: EmployeeDocument) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-md bg-background hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                          <div className="truncate">
                            <p
                              className="text-sm font-medium truncate"
                              title={doc.fileName}
                            >
                              {doc.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(doc.createdAt).toLocaleDateString(
                                "pl-PL",
                              )}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            const res =
                              await getEmployeeDocumentDownloadUrlAction(
                                employeeId,
                                doc.id,
                                activeFacilityId,
                              );

                            if (res.error) {
                              alert(res.error);
                              return;
                            }

                            if (res.data?.url) {
                              const link = document.createElement("a");
                              link.href = res.data.url;
                              link.target = "_blank";
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }}
                        >
                          <Download className="w-4 h-4 text-primary" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed rounded-lg bg-slate-50/30">
                    <FolderOpen className="w-8 h-8 mx-auto text-muted-foreground mb-3 opacity-30" />
                    <p className="text-sm text-muted-foreground">
                      Teczka pracownika jest pusta.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
