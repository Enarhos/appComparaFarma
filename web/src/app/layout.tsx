import type { Metadata } from "next";
import { Fraunces, Figtree } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "ComparaFarma — Compara precios de medicamentos en Chile",
    template: "%s | ComparaFarma",
  },
  description:
    "Compara en tiempo real los precios de tus medicamentos en 9 farmacias chilenas: Cruz Verde, Salcobrand, Ahumada, Dr. Simi y más. Gratis y sin publicidad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${figtree.variable}`}>
      <body className="min-h-screen bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
