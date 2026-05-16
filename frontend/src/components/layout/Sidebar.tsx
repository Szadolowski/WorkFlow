import Link from "next/link";
import { HardHat } from "lucide-react";

// Definiujemy dostępność modułów wg. ról z bazy danych
const NAV_ITEMS = [
  {
    label: "Panel Główny",
    href: "/dashboard",
    roles: ["ADMIN", "HR", "OFFICE", "FOREMAN", "ACCOUNTING", "WORKER"],
  },
  {
    label: "Pracownicy",
    href: "/dashboard/employees",
    roles: ["ADMIN", "HR", "OFFICE", "ACCOUNTING"],
  },
  {
    label: "Projekty i Budowy", // Zmienione z 'title' na 'label'
    href: "/dashboard/projects",
    icon: <HardHat className="w-5 h-5 mr-2 inline-block" />, // Opcjonalnie: ułożenie ikony
    roles: ["ADMIN", "OFFICE", "HR", "FOREMAN"], // Zmienione z 'allowedRoles' na 'roles'
  },
];

export default function Sidebar({ role }: { role: string }) {
  // Filtrujemy menu na podstawie roli przekazanej z Layoutu
  const allowedLinks = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 font-bold text-xl tracking-wider">
        WorkFlow.
      </div>
      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-4">
          {allowedLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors"
              >
                {link.icon && link.icon}
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
