import { useSyncExternalStore } from "react";

// Live boolean for a CSS media query, re-rendering when it starts/stops matching.
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches
  );
}
