import type { Metadata } from "next";
import "./globals.css";

// SITE_URL: actualizar cuando exista el dominio propio o la URL real de Vercel del proyecto web/
const SITE_URL = process.env.SITE_URL ?? "https://comparafarma.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ComparaFarma — Compara precios de medicamentos en Chile",
    template: "%s | ComparaFarma",
  },
  description:
    "Compara en tiempo real los precios de tus medicamentos en 9 farmacias chilenas: Cruz Verde, Salcobrand, Ahumada, Dr. Simi y más. Gratis y sin publicidad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
