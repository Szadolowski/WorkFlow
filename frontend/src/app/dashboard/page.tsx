import { redirect } from "next/navigation";
import { getProfileAction } from "@/app/actions/auth.actions";
import HrDashboard from "@/components/features/dashboard/HrDashboard";
import ForemanDashboard from "@/components/features/dashboard/ForemanDashboard";
import AccountingDashboard from "@/components/features/dashboard/AccountingDashboard";
import AdminDashboard from "@/components/features/dashboard/AdminDashboard";

export default async function DashboardPage() {
  const userResponse = await getProfileAction();

  if (!userResponse || "error" in userResponse) {
    redirect("/login");
  }

  // LOG DIAGNOSTYCZNY: Wypisze w terminalu (tam gdzie odpalasz serwer frontendowy), co dokładnie przyszło z backendu
  console.log("🛠️ DANE Z BACKENDU:", userResponse);

  // DEFENSYWNE POBIERANIE ROLI:
  // 1. Sprawdzamy czy rola jest bezpośrednio w obiekcie, czy głębiej (np. w .data lub .user)
  const rawRole =
    userResponse.role ||
    userResponse.data?.role ||
    userResponse.user?.role ||
    "";

  // 2. Wymuszamy format tekstu (String), usuwamy białe znaki (trim) i powiększamy litery (toUpperCase)
  const role = String(rawRole).trim().toUpperCase();

  let DashboardContent;

  switch (role) {
    case "HR":
      DashboardContent = <HrDashboard />;
      break;
    case "FOREMAN":
      DashboardContent = <ForemanDashboard />;
      break;
    case "ACCOUNTING":
      DashboardContent = <AccountingDashboard />;
      break;
    case "ADMIN":
      DashboardContent = <AdminDashboard />;
      break;
    default:
      DashboardContent = (
        <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
          <h1 className="text-3xl font-bold">Witaj w systemie WorkFlow!</h1>
          <p className="text-muted-foreground text-center">
            Twój spersonalizowany panel jest w trakcie przygotowywania.
            <br />
            <br />
            {/* Wyświetlamy na czerwono dokładną wartość, z którą nie poradził sobie switch */}
            <span className="text-sm font-mono text-destructive bg-destructive/10 p-2 rounded-md">
              Nierozpoznana rola: "{role}"
            </span>
          </p>
        </div>
      );
  }

  return <div className="mx-auto w-full max-w-7xl">{DashboardContent}</div>;
}
