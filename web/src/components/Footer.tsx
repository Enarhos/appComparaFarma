import { DonationWidget } from "./DonationWidget";
import { WEB_DONATIONS_PAUSED } from "@/lib/donationsConfig";
import { BrandMark } from "./BrandMark";

/**
 * Footer global (Sprint FEAT-WEB-DONATIONS). Se monta una sola vez desde
 * app/layout.tsx para que el acceso a donaciones sea permanente en toda la
 * Web sin repetir el CTA en cada página (explícitamente fuera de alcance:
 * no se agrega en cada resultado de medicamento).
 *
 * Mientras WEB_DONATIONS_PAUSED sea true, no se monta ningún CTA activo ni
 * texto público de donaciones. DonationWidget permanece sin cambios, listo
 * para volver a montarse cuando se reactive.
 */
export function Footer() {
  return (
    <footer className="mx-auto mt-16 max-w-5xl px-6 py-8">
      <div className="flex flex-col items-center gap-4 border-t border-line pt-6 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <BrandMark className="text-accent" />
          <p className="text-xs text-muted">Compara precios de medicamentos en Chile.</p>
        </div>
        {WEB_DONATIONS_PAUSED ? null : <DonationWidget />}
      </div>
    </footer>
  );
}
