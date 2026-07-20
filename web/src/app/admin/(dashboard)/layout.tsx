import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/admin/SignOutButton";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink">
            ComparaFarma
          </span>
          <h1 className="font-display text-lg font-semibold text-ink">Panel admin</h1>
        </div>
        <div className="flex items-center gap-3">
          {user?.email && <span className="text-sm text-muted">{user.email}</span>}
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}
