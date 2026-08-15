import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aporte no completado",
};

/**
 * Página de cancelación desde Khipu (Sprint FEAT-WEB-DONATIONS, cancel_url
 * de createKhipuPaymentV3) — el usuario desistió del pago antes de terminar.
 */
export default function DonationCancelledPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-semibold text-ink">El aporte no fue completado</h1>
      <p className="mt-4 text-muted">No se realizó ningún cobro. Puedes volver cuando quieras.</p>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-medium text-accent-ink underline underline-offset-2"
      >
        Volver a ComparaFarma
      </Link>
    </main>
  );
}
