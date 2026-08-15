import { DonationWidget } from "./DonationWidget";

/**
 * Footer global (Sprint FEAT-WEB-DONATIONS). Se monta una sola vez desde
 * app/layout.tsx para que el acceso a donaciones sea permanente en toda la
 * Web sin repetir el CTA en cada página (explícitamente fuera de alcance:
 * no se agrega en cada resultado de medicamento).
 */
export function Footer() {
  return (
    <footer className="mx-auto mt-16 max-w-5xl px-6 py-8">
      <div className="flex flex-col items-center gap-4 border-t border-line pt-6 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
        <p className="text-xs text-muted">ComparaFarma — comparador de precios de medicamentos en Chile.</p>
        <DonationWidget />
      </div>
    </footer>
  );
}
