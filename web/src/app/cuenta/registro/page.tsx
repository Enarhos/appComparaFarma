"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "submitting" | "check-email" | "error";

export default function CuentaRegistroPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/cuenta` },
    });

    if (error) {
      setErrorMessage(error.message === "User already registered" ? "Ya existe una cuenta con ese email." : error.message);
      setStatus("error");
      return;
    }

    // Con "Confirm email" desactivado en el proyecto de Supabase, signUp ya
    // devuelve sesión — con "Confirm email" activado, hay que esperar el
    // clic en el link que llega por correo (ver auth/callback/route.ts).
    if (data.session) {
      router.push("/cuenta");
      router.refresh();
      return;
    }

    setStatus("check-email");
  }

  if (status === "check-email") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Revisa tu email</h1>
        <p className="mt-3 text-sm text-muted">
          Te enviamos un link para confirmar tu cuenta. Una vez que lo abras, vas a poder ingresar.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 sm:px-6">
      <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink">
        PreciosFarma
      </span>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Crear cuenta</h1>

      {errorMessage && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
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
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña (mínimo 6 caracteres)"
          className="rounded-xl border border-line bg-paper-raised px-4 py-3 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-xl bg-accent px-4 py-3 font-semibold text-white transition hover:bg-accent-ink disabled:opacity-60"
        >
          {status === "submitting" ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/cuenta/ingresar" className="font-medium text-accent-ink hover:underline">
          Ingresa acá
        </Link>
      </p>
    </main>
  );
}
