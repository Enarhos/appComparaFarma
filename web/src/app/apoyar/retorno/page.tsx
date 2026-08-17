import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tu aporte a PreciosFarma",
};

/**
 * Página de retorno desde Khipu (Sprint FEAT-WEB-DONATIONS, return_url de
 * createKhipuPaymentV3). IMPORTANTE: llegar aquí solo significa que el
 * navegador volvió desde Khipu — no que el pago se haya completado ni
 * verificado. Todavía no existe una forma de consultar el estado real del
 * pago desde Web (KHIPU_PAYMENT_CONFIRMATION: NOT_IMPLEMENTED, ver
 * docs/operations/PLATFORM_SERVICE_REVIEW_KHIPU.md) — por eso este texto no
 * afirma éxito bajo ninguna circunstancia.
 */
export default function DonationReturnPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-semibold text-ink">Gracias por apoyar PreciosFarma</h1>
      <p className="mt-4 text-muted">
        Si realizaste el pago, Khipu puede tardar unos momentos en confirmarlo. Todavía no podemos verificar el
        estado del pago desde esta página, pero si el pago se completó, Khipu te lo confirmará por su parte.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-medium text-accent-ink underline underline-offset-2"
      >
        Volver a PreciosFarma
      </Link>
    </main>
  );
}
