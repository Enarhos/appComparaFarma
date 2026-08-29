import { useRef, useCallback } from "react";
import * as Sentry from "@sentry/react-native";
import { parseQueryIntent, queryIntentCacheKey } from "@comparafarma/domain";
import { searchMedications } from "@/lib/search";
import { getCached, setCached } from "@/lib/cache";
import { useSearchStore } from "@/store/searchStore";
import { useLocationStore } from "@/store/locationStore";
import { useAlertsStore } from "@/store/alertsStore";
import { useToastStore } from "@/store/toastStore";
import { getBranchIndex, getPharmaciesForCommune } from "@/lib/branches";
import { captureSearch } from "@/lib/analytics";
import { formatCLP } from "@/lib/formatters";

export function useSearch() {
  const abortRef = useRef<AbortController | null>(null);
  const { setLoading, setResults, setError, setQuery } = useSearchStore();
  const selectedCommune = useLocationStore((s) => s.selectedCommune);
  const { alerts, markTriggered } = useAlertsStore();
  const showToast = useToastStore((s) => s.show);

  const search = useCallback(async function search(rawQuery: string, bypassCache = false) {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    // CF-SEARCH-002 — Mobile enviaba `cleanQuery(rawQuery)` a la API, así que
    // la concentración se perdía ANTES de salir del teléfono y el backend no
    // podía usarla ni para la caché ni para el orden. Ahora se manda el texto
    // crudo y el backend deriva la misma consulta amplia internamente
    // (`intent.retrievalQuery === cleanQuery(rawQuery)`), sin cambiar lo que
    // reciben las 9 farmacias.
    const intent = parseQueryIntent(rawQuery);
    const query = intent.retrievalQuery;
    if (!query) {
      setResults([]);
      return;
    }

    // La API rechaza con 400 cualquier `q` de más de 120 caracteres. Para un
    // texto largo (pegar una receta completa) se cae al comportamiento
    // anterior: se manda la consulta amplia, que siempre es más corta. Se
    // pierde la intención en ese caso, no los resultados.
    const apiQuery = rawQuery.trim().length <= 120 ? rawQuery.trim() : query;

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

    // CF-SEARCH-002 — misma corrección que en el backend: la clave incorpora
    // la intención (dosis, cantidad, forma). Con la clave anterior
    // ("ibuprofeno" para las tres), buscar 400 mg después de 600 mg servía la
    // lista cacheada de 600 mg desde AsyncStorage sin siquiera llamar a la API.
    const cacheKey =
      queryIntentCacheKey(intent) +
      (onlyPharmacies ? `:${[...onlyPharmacies].sort().join(",")}` : "");
    if (!bypassCache) {
      const cached = await getCached(cacheKey);
      if (cached) {
        setResults(cached);
        return;
      }
    }

    try {
      const results = await searchMedications(apiQuery, abortRef.current.signal, onlyPharmacies);
      await setCached(cacheKey, results);
      setResults(results);
      captureSearch(rawQuery, query, results, selectedCommune ?? null);

      // Chequear alertas de precio activas
      for (const alert of alerts) {
        const match = results.find((r) => r.matchKey === alert.matchKey);
        if (!match || match.bestPrice > alert.targetPrice) continue;
        // Precio bajó del objetivo — no disparar más de una vez por día
        const lastTriggered = alert.triggeredAt ? alert.triggeredAt.split("T")[0] : null;
        const todayStr = new Date().toISOString().split("T")[0];
        if (lastTriggered === todayStr) continue;
        markTriggered(alert.matchKey);
        showToast(`${alert.canonicalName}`, {
          subtitle: `Bajó a ${formatCLP(match.bestPrice)} — objetivo ${formatCLP(alert.targetPrice)} alcanzado`,
          type: "alert",
        });
      }
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
  }, [setLoading, setResults, setError, setQuery, selectedCommune]);

  return { search };
}
