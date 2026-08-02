import type { CompareInput } from "@/domain/reste-a-vivre";

/**
 * The run a visitor asked to keep, held while they go and confirm their email.
 *
 * Creating an account takes a round trip through an inbox. Without somewhere to
 * put the simulation, the visitor comes back signed in and empty-handed, having
 * been promised the opposite — so it waits in the same storage the wizard already
 * uses, and the account page picks it up on arrival.
 */

export const PENDING_KEY = "statwise:pending-simulation:v1";

export type PendingSimulation = {
  kind: "job";
  input: CompareInput;
  summary: {
    currentCity: string;
    targetCity: string;
    targetDistrict: string;
    deltaResteAVivre: number;
    currentResteAVivre: number;
    targetResteAVivre: number;
  };
  engineVersion: string;
  datasetVersion: string;
};

export function savePending(pending: PendingSimulation): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    // Private mode or quota. The account is still created; only the run is lost,
    // and the visitor can re-run it in two minutes.
  }
}

export function readPending(): PendingSimulation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingSimulation) : null;
  } catch {
    return null;
  }
}

export function clearPending(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_KEY);
  } catch {
    // Nothing to do: a stale entry is overwritten by the next save.
  }
}
