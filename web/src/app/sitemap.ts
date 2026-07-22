import type { MetadataRoute } from "next";
import { QUICK_SEARCHES } from "@/constants/pharmacies";
import { getSiteUrl } from "@/lib/site";

// No se puede listar cada búsqueda arbitraria posible — se indexa la lista
// curada de "búsquedas frecuentes" que ya se muestra en la Home, la misma
// que usan los usuarios reales, en vez de inventar una lista aparte.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  return [
    { url: base, lastModified, changeFrequency: "daily", priority: 1 },
    ...QUICK_SEARCHES.map((term) => ({
      url: `${base}/buscar/${encodeURIComponent(term)}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
