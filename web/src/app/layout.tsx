import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import { Footer } from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "PreciosFarma — Compara precios de medicamentos en Chile",
    template: "%s | PreciosFarma",
  },
  description:
    "Compara en tiempo real los precios de tus medicamentos en 9 farmacias chilenas: Cruz Verde, Salcobrand, Ahumada, Dr. Simi y más. Gratis y sin publicidad.",
  applicationName: "PreciosFarma",
  openGraph: {
    type: "website",
    locale: "es_CL",
    siteName: "PreciosFarma",
    title: "PreciosFarma — Compara precios de medicamentos en Chile",
    description:
      "Compara en tiempo real los precios de tus medicamentos en 9 farmacias chilenas. Gratis y sin publicidad.",
    url: getSiteUrl(),
  },
  twitter: {
    card: "summary",
    title: "PreciosFarma — Compara precios de medicamentos en Chile",
    description:
      "Compara en tiempo real los precios de tus medicamentos en 9 farmacias chilenas. Gratis y sin publicidad.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-paper text-ink antialiased">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
