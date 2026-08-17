"use client";

// Fix Bug 2 (Mobile Validation, 2026-08-14) — mitigación del problema
// documentado oficialmente por Supabase: escáneres de seguridad de email
// (Gmail, Microsoft Defender Safe Links, etc.) "prefetchean" el link de
// confirmación/recuperación antes de que la Persona lo abra, consumiendo el
// OTP de un solo uso y dejando el link real inválido ("otp_expired").
// Fuente oficial: supabase.com/docs/guides/troubleshooting/
// otp-verification-failures-token-has-expired-or-otp_expired-errors-5ee4d0
//
// Mitigación recomendada por esa misma fuente: no poner el link que
// consume el OTP directo en el email — poner un link a una página propia
// (esta), sin efectos al cargar (segura de prefetchear), que solo llama a
// supabase.auth.verifyOtp() cuando la Persona hace clic en un botón real.
//
// Esta página reemplaza a `{{ .ConfirmationURL }}` en las plantillas de
// email de Supabase (Reset Password / Confirm signup) — ver
// docs/operations/RUNBOOK.md para el paso a paso de esa configuración.
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "confirming" | "success" | "error";

// Mismos nombres de pantalla ya usados por el deep link de Mobile
// (mobile/src/lib/sessionManager.ts: Linking.createURL("login") /
// Linking.createURL("actualizar-clave")) — no se agrega ningún código nuevo
// en Mobile, se reutiliza el manejo de #access_token que ya existe ahí.
const MOBILE_SCREEN_BY_TYPE: Record<string, string> = {
  recovery: "actualizar-clave",
  signup: "login",
};

const WEB_NEXT_BY_TYPE: Record<string, string> = {
  recovery: "/cuenta/actualizar-clave",
  signup: "/cuenta",
};

function ConfirmarForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "recovery") as EmailOtpType;

  const [status, setStatus] = useState<Status>("idle");
  const [mobileDeepLink, setMobileDeepLink] = useState<string | null>(null);

  async function handleConfirm() {
    if (!tokenHash) return;
    setStatus("confirming");

    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (error || !data.session) {
      setStatus("error");
      return;
    }

    // Sesión ya establecida acá (cookies, vía @supabase/ssr) — para quien
    // sigue en la Web. Para quien prefiere volver a la app Mobile, se arma
    // el mismo deep link que ya maneja `completeSessionFromUrl` (sin tocar
    // ese código): los tokens recién obtenidos viajan en el fragmento, igual
    // que en el flujo de registro existente.
    const screen = MOBILE_SCREEN_BY_TYPE[type] ?? "login";
    const { access_token, refresh_token } = data.session;
    setMobileDeepLink(
      `comparafarma://${screen}#access_token=${encodeURIComponent(access_token)}&refresh_token=${encodeURIComponent(refresh_token)}`
    );
    setStatus("success");
  }

  function continueOnWeb() {
    const next = WEB_NEXT_BY_TYPE[type] ?? "/cuenta";
    router.push(next);
    router.refresh();
  }

  if (!tokenHash) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Link incompleto</h1>
        <p className="mt-3 text-sm text-muted">
          Este link no tiene la información necesaria para confirmar. Puede que lo hayas abierto de forma incompleta —
          volvé a solicitarlo.
        </p>
        <p className="mt-4">
          <Link href="/cuenta/recuperar" className="font-medium text-accent-ink hover:underline">
            Solicitar un link nuevo
          </Link>
        </p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">El link ya no es válido</h1>
        <p className="mt-3 text-sm text-muted">
          Puede haber expirado o haber sido usado antes. Pedí uno nuevo e intentá de nuevo.
        </p>
        <p className="mt-4">
          <Link href="/cuenta/recuperar" className="font-medium text-accent-ink hover:underline">
            Solicitar un link nuevo
          </Link>
        </p>
      </main>
    );
  }

  if (status === "success") {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Confirmado</h1>
        <p className="mt-3 text-sm text-muted">¿Dónde querés continuar?</p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={continueOnWeb}
            className="rounded-xl bg-accent px-4 py-3 font-semibold text-white transition hover:bg-accent-ink"
          >
            Continuar en la web
          </button>
          {mobileDeepLink && (
            <a
              href={mobileDeepLink}
              className="rounded-xl border border-line px-4 py-3 text-center font-semibold text-ink transition hover:bg-paper-raised"
            >
              Abrir en la app
            </a>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-center">
      <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink">
        PreciosFarma
      </span>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Confirmar</h1>
      <p className="mt-3 text-sm text-muted">
        Por tu seguridad, confirmá con el botón — no lo hacemos automáticamente al abrir el link.
      </p>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={status === "confirming"}
        className="mt-6 rounded-xl bg-accent px-4 py-3 font-semibold text-white transition hover:bg-accent-ink disabled:opacity-60"
      >
        {status === "confirming" ? "Confirmando…" : "Confirmar"}
      </button>
    </main>
  );
}

export default function AuthConfirmarPage() {
  return (
    <Suspense>
      <ConfirmarForm />
    </Suspense>
  );
}
