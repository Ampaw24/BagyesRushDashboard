import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Carries the message the API returned out to the action that reports it.
 *
 * Every response has one ("Category status updated successfully", "Vendor
 * approved successfully", …) and that is the wording an admin should see.
 * `apiFetch` unwraps the envelope down to `data`, so the message needs somewhere
 * to go.
 *
 * AsyncLocalStorage rather than React's `cache()`: `cache` is scoped to a
 * Server Component render, so a Server Action reading it got a *different*
 * object from the one `apiFetch` wrote to and always fell back. ALS follows the
 * async call chain, which is exactly the lifetime wanted here, and keeps
 * concurrent admins from seeing each other's messages the way a module-level
 * variable would.
 */
type Slot = { message: string };

const storage = new AsyncLocalStorage<Slot>();

/** Runs `fn` with a fresh slot. Everything it awaits shares that slot. */
export function withApiMessages<T>(fn: () => Promise<T>): Promise<T> {
  return storage.run({ message: "" }, fn);
}

/** Called by the API client on every successful response. */
export function rememberApiMessage(message: string): void {
  const slot = storage.getStore();
  if (slot) slot.message = message;
}

/**
 * The message from the most recent call in this scope. An action that makes
 * several calls gets the last one, which is the one that completed the work.
 * Falls back when there is no scope or the API sent nothing usable.
 */
export function lastApiMessage(fallback: string): string {
  return storage.getStore()?.message || fallback;
}
