import { useEffect, useRef } from "react";

export function useDebounce(fn: () => void, delay: number, deps: unknown[]) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = setTimeout(fn, delay);
    timerRef.current = id;
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
