"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  addRecipeItem,
  removeRecipeItem,
  type AddRecipeItemResult,
  type RecipeItem,
} from "@/lib/recipeList";

const STORAGE_KEY = "recipe-list-v1";

// Store externo mínimo sobre localStorage, siguiendo useSyncExternalStore en
// vez del patrón "leer en un useEffect y guardarlo con setState" — ese
// patrón dispara la regla react-hooks/set-state-in-effect (llamar setState
// directo en el cuerpo de un efecto) y además complica evitar el mismatch
// de hidratación SSR/cliente. useSyncExternalStore ya resuelve ambos: trae
// getServerSnapshot() para el render del servidor y no llama setState en
// ningún efecto propio.
const listeners = new Set<() => void>();
let cache: RecipeItem[] | null = null;

function parse(raw: string | null): RecipeItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecipeItem[]) : [];
  } catch {
    return [];
  }
}

function getSnapshot(): RecipeItem[] {
  if (cache === null) {
    cache = typeof window === "undefined" ? [] : parse(window.localStorage.getItem(STORAGE_KEY));
  }
  return cache;
}

function getServerSnapshot(): RecipeItem[] {
  return [];
}

/**
 * Solo para tests: el cache de módulo no se entera si algo escribe
 * localStorage por fuera de persist() (ej. un test que siembra datos
 * directo en window.localStorage). Llamar en afterEach/beforeEach junto
 * con window.localStorage.clear() en cualquier test que toque esta store.
 */
export function __resetRecipeListCacheForTests(): void {
  cache = null;
}

function persist(items: RecipeItem[]): void {
  cache = items;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage puede fallar (modo privado, cuota llena) — la lista
      // sigue funcionando en memoria durante la sesión aunque no persista.
    }
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  function onStorage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY) return;
    cache = parse(event.newValue);
    listener();
  }
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

export interface UseRecipeList {
  items: RecipeItem[];
  add(item: RecipeItem): AddRecipeItemResult;
  remove(matchKey: string): void;
  clear(): void;
  isInList(matchKey: string): boolean;
}

/** Lista de "mi receta" persistida en localStorage (Sprint E). */
export function useRecipeList(): UseRecipeList {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((item: RecipeItem): AddRecipeItemResult => {
    const outcome = addRecipeItem(getSnapshot(), item);
    if (outcome.result === "added") {
      persist(outcome.items);
    }
    return outcome.result;
  }, []);

  const remove = useCallback((matchKey: string) => {
    persist(removeRecipeItem(getSnapshot(), matchKey));
  }, []);

  const clear = useCallback(() => {
    persist([]);
  }, []);

  const isInList = useCallback(
    (matchKey: string) => items.some((item) => item.matchKey === matchKey),
    [items]
  );

  return { items, add, remove, clear, isInList };
}
