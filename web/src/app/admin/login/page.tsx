"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function errorMessage(code: string | null): string | null {
  if (code === "unauthorized") return "Esa cuenta no tiene acceso al panel admin.";
  if (code === "auth") return "No se pudo iniciar sesión. Intenta de nuevo.";
  return null;
}

function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"password" | "google" | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryError = errorMessage(searchParams.get("error"));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading("password");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(null);
    if (signInError) {
      setError("Email o contraseña incorrectos.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setError(null);
    setLoading("google");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink">
        PreciosFarma
      </span>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Panel admin</h1>

      {(error ?? queryError) && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error ?? queryError}</p>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={loading !== null}
        className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-line bg-paper-raised px-4 py-3 font-medium text-ink transition hover:border-accent disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.98v2.33A9 9 0 0 0 9 18Z"
          />
          <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.98a9 9 0 0 0 0 8.1l2.99-2.33Z" />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.95l2.99 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
          />
        </svg>
        {loading === "google" ? "Redirigiendo…" : "Continuar con Google"}
      </button>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-line" />o<span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-xl border border-line bg-paper-raised px-4 py-3 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="rounded-xl border border-line bg-paper-raised px-4 py-3 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <button
          type="submit"
          disabled={loading !== null}
          className="rounded-xl bg-accent px-4 py-3 font-semibold text-white transition hover:bg-accent-ink disabled:opacity-60"
        >
          {loading === "password" ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
