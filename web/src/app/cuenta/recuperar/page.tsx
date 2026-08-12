"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Product Completion Sprint 01 — recuperación de contraseña, Web.
//
// Usa exclusivamente la capacidad nativa de Supabase Auth
// (`resetPasswordForEmail`), sin backend ni API propios. El link que llega
// por correo redirige a `/auth/callback?next=/cuenta/actualizar-clave`, que
// ya existe (mismo route handler que ya usa la confirmación de registro y
// el login de Google) — intercambia el `code` por una sesión antes de
// llegar a `/cuenta/actualizar-clave`, evitando el problema ya señalado en
// docs/execution/SPIKE-001_IDENTITY_ENTITLEMENT_POC.md de tokens expuestos
// en el fragmento de la URL.
type Status = "idle" | "submitting" | "check-email" | "error";

export default function CuentaRecuperarPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const supabase = createClient();
    // No se distingue el caso "email no existe" del caso "email enviado" —
    // mismo criterio de mensaje genérico ya usado en LoginForm.tsx, y
    // evita revelar si un correo tiene o no cuenta creada.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/cuenta/actualizar-clave`,
    });

    setStatus("check-email");
  }

  if (status === "check-email") {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Revisa tu email</h1>
        <p className="mt-3 text-sm text-muted">
          Si existe una cuenta con ese correo, te enviamos un link para elegir una contraseña nueva.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink">
        ComparaFarma
      </span>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Recuperar contraseña</h1>
      <p className="mt-2 text-sm text-muted">Te enviaremos un link para elegir una contraseña nueva.</p>

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
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-xl bg-accent px-4 py-3 font-semibold text-white transition hover:bg-accent-ink disabled:opacity-60"
        >
          {status === "submitting" ? "Enviando…" : "Enviar link"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        <Link href="/cuenta/ingresar" className="font-medium text-accent-ink hover:underline">
          Volver a ingresar
        </Link>
      </p>
    </main>
  );
}
