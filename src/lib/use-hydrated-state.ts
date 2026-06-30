"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

/**
 * State that starts from `initial` (used for SSR and the first client render to
 * avoid hydration mismatch), then hydrates once from a browser-only source
 * (e.g. localStorage) after mount.
 *
 * The one-time setState-in-effect is intentional: the persisted value cannot be
 * read during SSR, so it must be applied after mount. This is the single place
 * that exception lives.
 */
export function useHydratedState<T>(
  initial: T,
  read: () => T | null,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = read();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of browser-only state (SSR-safe)
    if (stored !== null) setValue(stored);
    setHydrated(true);
    // hydrate once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [value, setValue, hydrated];
}
