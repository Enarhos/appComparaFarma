"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Clicks" },
  { href: "/admin/config", label: "Config" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/usuarios", label: "Usuarios" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-line px-6">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "border-accent text-accent-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
