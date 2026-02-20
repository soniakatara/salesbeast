"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/roleplay", label: "Roleplay" },
  { href: "/rate", label: "Rate" },
  { href: "/playbooks", label: "Playbooks" },
  { href: "/notes", label: "Notes" },
  { href: "/ask", label: "Ask" },
  { href: "/history", label: "History" },
  { href: "/insights", label: "Insights" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 text-sm font-medium rounded-sm whitespace-nowrap transition-colors ${
              isActive
                ? "bg-violet-500/20 text-violet-300"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
