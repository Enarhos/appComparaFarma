import { useRef, useCallback } from "react";
import * as Sentry from "@sentry/react-native";
import { cleanQuery } from "@/lib/normalization";
import { searchMedications } from "@/lib/search";
import { getCached, setCached } from "@/lib/cache";
import { useSearchStore } from "@/store/searchStore";
import { useLocationStore } from "@/store/locationStore";
import { getBranchIndex, getPharmaciesForCommune } from "@/lib/branches";
import { captureSearch } from "@/lib/analytics";

export function useSearch() {
  const abortRef = useRef<AbortController | null>(null);
  const { setLoading, setResults, setError, setQuery } = useSearchStore();
  const selectedCommune = useLocationStore((s) => s.selectedCommune);

  const search = useCallback(async function search(rawQuery: string, bypassCache = false) {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const query = cleanQuery(rawQuery);
    if (!query) {
      setResults([]);
      return;
    }

    setQuery(rawQuery);
    setLoading();

    // Determinar farmacias según la comuna seleccionada
    let onlyPharmacies: string[] | undefined;
    if (selectedCommune) {
      const index = await getBranchIndex();
      if (index) {
        const slugs = getPharmaciesForCommune(selectedCommune, index);
        if (slugs.length === 0) {
          // Comuna sin farmacias registradas
          setResults([]);
          return;
        }
        onlyPharmacies = slugs;
      }
    }

    const cacheKey = (query.toLowerCase().trim()) + (onlyPharmacies ? `:${[...onlyPharmacies].sort().join(",")}` : "");
    if (!bypassCache) {
      const cached = await getCached(cacheKey);
      if (cached) {
        setResults(cached);
        return;
      }
    }

    try {
      const results = await searchMedications(query, abortRef.current.signal, onlyPharmacies);
      await setCached(cacheKey, results);
      setResults(results);
      captureSearch(rawQuery, query, results, selectedCommune ?? null);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      Sentry.captureException(err, { extra: { query } });
      const isNetworkError =
        err instanceof TypeError &&
        (err.message.includes("Network") ||
          err.message.includes("fetch") ||
          err.message.includes("Failed"));
      setError(
        isNetworkError
          ? "Sin conexión a internet. Verifica tu red e intenta de nuevo."
          : "No se pudo consultar las farmacias. Intenta de nuevo en un momento."
      );
    }
  }, [setLoading, setResults, setError, setQuery]);

  return { search };
}
