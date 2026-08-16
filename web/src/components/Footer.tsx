import { DonationWidget } from "./DonationWidget";
import { WEB_DONATIONS_PAUSED } from "@/lib/donationsConfig";

/**
 * Footer global (Sprint FEAT-WEB-DONATIONS). Se monta una sola vez desde
 * app/layout.tsx para que el acceso a donaciones sea permanente en toda la
 * Web sin repetir el CTA en cada página (explícitamente fuera de alcance:
 * no se agrega en cada resultado de medicamento).
 *
 * Donaciones pausadas temporalmente (Production Closure, 2026-08-16, ver
 * lib/donationsConfig.ts): mientras WEB_DONATIONS_PAUSED sea true, no se
 * monta ningún CTA activo — solo un texto neutro, sin pedir dinero y sin
 * botón hacia Khipu. DonationWidget permanece sin cambios, listo para
 * volver a montarse cuando se reactive.
 */
export function Footer() {
  return (
    <footer className="mx-auto mt-16 max-w-5xl px-6 py-8">
      <div className="flex flex-col items-center gap-4 border-t border-line pt-6 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
        <p className="text-xs text-muted">ComparaFarma — comparador de precios de medicamentos en Chile.</p>
        {WEB_DONATIONS_PAUSED ? (
          <p className="text-xs text-muted">
            Los aportes están temporalmente pausados mientras ComparaFarma se encuentra en su etapa inicial de
            crecimiento.
          </p>
        ) : (
          <DonationWidget />
        )}
      </div>
    </footer>
  );
}
