import type { Metadata } from "next";
import { RecipeComparisonView } from "@/components/RecipeComparisonView";

// Página personal (localStorage del navegador, sin cuenta de usuario) — no
// tiene sentido indexarla, cada visitante ve una lista distinta.
export const metadata: Metadata = {
  title: "Mi receta",
  robots: { index: false, follow: false },
};

export default function MiRecetaPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-ink">Mi receta</h1>
      <p className="mt-1 text-sm text-muted">
        Compará el costo de comprar todos tus medicamentos en una sola farmacia versus repartir la compra donde
        sale más barato cada uno.
      </p>
      <div className="mt-6">
        <RecipeComparisonView />
      </div>
    </main>
  );
}
