import { useRef, useCallback } from "react";
import * as Sentry from "@sentry/react-native";
import { cleanQuery } from "@/lib/normalization";
import { searchMedications } from "@/lib/search";
import { getCached, setCached } from "@/lib/cache";
import { useSearchStore } from "@/store/searchStore";

export function useSearch() {
  const abortRef = useRef<AbortController | null>(null);
  const { setLoading, setResults, setError, setQuery } = useSearchStore();

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

    const cacheKey = query.toLowerCase().trim();
    if (!bypassCache) {
      const cached = await getCached(cacheKey);
      if (cached) {
        setResults(cached);
        return;
      }
    }

    try {
      const results = await searchMedications(query, abortRef.current.signal);
      await setCached(cacheKey, results);
      setResults(results);
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
