"use client";

import Link from "next/link";
import { HardHat, WalletCards, Clock3 } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

import { useFacility } from "@/hooks/useFacility";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    label: "Płace",
    href: "/dashboard/payroll",
    icon: <WalletCards className="w-5 h-5 mr-2 inline-block" />,
    roles: ["ADMIN", "ACCOUNTING"],
  },
  {
    label: "Projekty i Budowy",
    href: "/dashboard/projects",
    icon: <HardHat className="w-5 h-5 mr-2 inline-block" />,
    roles: ["ADMIN", "OFFICE", "HR", "FOREMAN"],
  },
  {
    label: "Czas pracy",
    href: "/dashboard/time-entries",
    icon: <Clock3 className="w-5 h-5 mr-2 inline-block" />,
    roles: ["ADMIN", "FOREMAN"],
  },
];

export default function Sidebar({ role }: { role: string }) {
  const { facilities, activeFacilityId, activeFacility, setActiveFacilityId } =
    useFacility();

  // Filtrujemy menu na podstawie roli przekazanej z Layoutu
  const allowedLinks = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 font-bold text-xl tracking-wider">
        WorkFlow.
      </div>
      <ThemeToggle />
      <div className="border-b border-slate-800 px-4 py-4">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Aktywny zakład
        </p>
        <div className="mt-2">
          <Select
            value={activeFacilityId}
            onValueChange={setActiveFacilityId}
            disabled={facilities.length === 0}
          >
            <SelectTrigger className="w-full border-slate-700 bg-slate-950/60 text-white">
              <SelectValue placeholder="Wybierz zakład" />
            </SelectTrigger>
            <SelectContent>
              {facilities.map((facility) => (
                <SelectItem key={facility.id} value={facility.id}>
                  {facility.name}
                  {facility.code ? ` (${facility.code})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {activeFacility && (
          <p className="mt-2 px-1 text-xs text-slate-400">
            {activeFacility.address || "Brak adresu"}
          </p>
        )}
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
