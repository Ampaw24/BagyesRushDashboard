/**
 * Recovering from a deploy that happened underneath somebody.
 *
 * Next.js splits the app into hashed JavaScript chunks and names them in the
 * HTML it served. Deploy a new build and those filenames change, so a browser
 * that had the dashboard open before the deploy asks for a chunk that no longer
 * exists the moment somebody clicks a link. The request 404s, React throws, and
 * the page shows a minified production error — which a refresh fixes, because
 * a refresh fetches the new HTML naming the new chunks.
 *
 * That is precisely the "error that disappears when you reload" shape, and it
 * cannot be fixed by writing better components: nothing is wrong with the code,
 * the code is simply gone.
 *
 * So detect it and do the reload automatically, once.
 */

/** Recognise a missing-chunk failure across the wordings browsers use for it. */
export function isStaleDeploymentError(error: unknown): boolean {
  if (!error) return false;

  const name = (error as { name?: string }).name ?? "";
  const message = (error as { message?: string }).message ?? "";
  const haystack = `${name} ${message}`.toLowerCase();

  return (
    haystack.includes("chunkloaderror") ||
    haystack.includes("loading chunk") ||
    haystack.includes("loading css chunk") ||
    // Chrome and Safari wording for a failed dynamic import.
    haystack.includes("failed to fetch dynamically imported module") ||
    haystack.includes("error loading dynamically imported module") ||
    // Firefox.
    haystack.includes("importing a module script failed") ||
    // A Server Action the new build no longer knows about. Every mutation in
    // this dashboard goes through one, and their ids change per build - so this
    // is the *most likely* way a deploy surfaces here, and it matched none of
    // the chunk wordings above. The symptom is the same and so is the cure.
    haystack.includes("failed to find server action") ||
    (haystack.includes("server action") && haystack.includes("was not found"))
  );
}

/** Marks that we have already reloaded, so a genuine fault cannot loop. */
const RELOAD_FLAG = "bagyes:reloaded-for-stale-chunk";

/**
 * Reload once for a stale deployment, and only once.
 *
 * The guard matters more than the reload. If the chunk is missing for some
 * other reason — a broken deploy, a CDN serving 404s — reloading on every
 * error would put the browser in a loop that looks like the dashboard being
 * down rather than the one bad deploy it is. `sessionStorage` is per tab and
 * survives the reload, which is exactly the scope needed.
 *
 * @returns true when a reload was triggered and the caller should render nothing.
 */
export function recoverFromStaleDeployment(error: unknown): boolean {
  if (typeof window === "undefined" || !isStaleDeploymentError(error)) {
    return false;
  }

  try {
    if (window.sessionStorage.getItem(RELOAD_FLAG)) {
      return false;
    }

    window.sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    // Private mode, or storage disabled. Reloading once without the guard is
    // still better than showing an error we know a reload fixes.
  }

  window.location.reload();

  return true;
}

/**
 * Clears the guard once the app has rendered successfully, so the *next*
 * deploy can recover too. Without this a tab gets one automatic recovery for
 * its entire lifetime.
 */
export function clearStaleDeploymentFlag(): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
