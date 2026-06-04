"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BookOpenCheck,
  Building2,
  Clock3,
  HardHat,
  Menu,
  WalletCards,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

import { useFacility } from "@/hooks/useFacility";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NAV_ITEMS = [
  {
    label: "Panel Główny",
    href: "/dashboard",
    roles: ["ADMIN", "HR", "OFFICE", "FOREMAN", "ACCOUNTING", "WORKER"],
  },
  {
    label: "Pracownicy",
    href: "/dashboard/employees",
    roles: ["ADMIN", "HR", "OFFICE", "ACCOUNTING", "FOREMAN"],
  },
  {
    label: "Płace",
    href: "/dashboard/payroll",
    icon: <WalletCards className="mr-2 inline-block h-5 w-5" />,
    roles: ["ADMIN", "ACCOUNTING"],
  },
  {
    label: "Projekty i Budowy",
    href: "/dashboard/projects",
    icon: <HardHat className="mr-2 inline-block h-5 w-5" />,
    roles: ["ADMIN", "OFFICE", "HR", "FOREMAN"],
  },
  {
    label: "Czas pracy",
    href: "/dashboard/time-entries",
    icon: <Clock3 className="mr-2 inline-block h-5 w-5" />,
    roles: ["ADMIN", "FOREMAN"],
  },
  {
    label: "Zakłady",
    href: "/dashboard/facilities",
    icon: <Building2 className="mr-2 inline-block h-5 w-5" />,
    roles: ["ADMIN"],
  },
  {
    label: "BHP i uprawnienia",
    href: "/dashboard/certifications/dictionary",
    icon: <BookOpenCheck className="mr-2 inline-block h-5 w-5" />,
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Wygasające BHP",
    href: "/dashboard/certifications/expiring",
    icon: <AlertTriangle className="mr-2 inline-block h-5 w-5" />,
    roles: ["ADMIN", "HR"],
  },
];

export default function Sidebar({ role }: { role: string }) {
  const { facilities, activeFacilityId, activeFacility, setActiveFacilityId } =
    useFacility();

  const allowedLinks = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const facilitySelector = (
    <div>
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
  );

  const navigationLinks = (
    <ul className="space-y-2">
      {allowedLinks.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white"
          >
            {link.icon && link.icon}
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 text-white md:hidden">
        <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
          <Link
            href="/dashboard"
            className="shrink-0 text-lg font-bold tracking-wider"
          >
            WorkFlow.
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium hover:bg-slate-800 [&::-webkit-details-marker]:hidden">
                <Menu className="mr-2 h-4 w-4" />
                Menu
              </summary>

              <div className="fixed left-4 right-4 top-16 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-xl">
                <div className="border-b border-slate-800 pb-4">
                  {facilitySelector}
                </div>

                <nav className="pt-4">{navigationLinks}</nav>
              </div>
            </details>
          </div>
        </div>
      </header>

      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 text-white md:flex">
        <div className="flex h-16 items-center border-b border-slate-800 px-6 text-xl font-bold tracking-wider">
          WorkFlow.
        </div>

        <div className="px-4 py-3">
          <ThemeToggle />
        </div>

        <div className="border-b border-slate-800 px-4 py-4">
          {facilitySelector}
        </div>

        <nav className="flex-1 py-6">
          <div className="px-4">{navigationLinks}</div>
        </nav>
      </aside>
    </>
  );
}
