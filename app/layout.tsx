import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FarmacyApp - Compara precios de remedios en Chile",
  description: "Encuentra el mejor precio para tus medicamentos en Cruz Verde, Salcobrand, Ahumada y más farmacias de Chile.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-pharmacy-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Rx</span>
            </div>
            <span className="text-xl font-bold text-gray-800">FarmacyApp</span>
            <span className="text-sm text-gray-400 hidden sm:block">Compara precios de remedios en Chile</span>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="text-center text-sm text-gray-400 py-8 border-t border-gray-100 mt-16">
          Los precios pueden variar. Actualizado diariamente desde las farmacias.
        </footer>
      </body>
    </html>
  );
}
