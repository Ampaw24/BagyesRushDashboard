"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { CloseIcon, RefreshIcon } from "../_lib/icons";
import { clearStaleDeploymentFlag } from "@/lib/http/chunk-recovery";
import { CLIENT_BUILD_ID, fetchServerBuildId, isOutdated } from "@/lib/http/build-version";

/**
 * "A new version is available — Update."
 *
 * A deploy replaces the hashed chunks this tab was told to load, so a browser
 * left open across one crashes the moment somebody clicks a link. There is
 * already a reactive cure in `chunk-recovery.ts`, but it runs *after* the crash
 * and only for errors that reach an error boundary — so the people who never
 * refresh kept seeing the error screen. This offers the reload before anything
 * breaks.
 *
 * Three deliberate choices:
 *
 * - **A banner, not a toast.** `ToastProvider` dismisses itself after five
 *   seconds and has no action button. An update prompt nobody was looking at when
 *   it appeared is the situation we are already in.
 * - **Offered, not forced.** A reload loses whatever is typed into the form on
 *   screen. An admin mid-refund should finish first, so this waits to be clicked.
 *   The reactive recovery still catches them if they navigate instead.
 * - **Checked on focus, not only on a timer.** A tab left open all weekend should
 *   notice when somebody looks at it, not up to a minute later.
 */

/** Slow on purpose: nothing here is urgent, and every tab asks. */
const POLL_INTERVAL_MS = 60_000;

/** Remembers a dismissal per build, so "later" does not mean "never again". */
const DISMISSED_KEY = "bagyes:update-dismissed-build";

/**
 * Which build, if any, this tab has already been told about and waved away.
 *
 * Per build rather than a flag, so dismissing today's update does not silence
 * tomorrow's. Per tab (`sessionStorage`) because that is the scope of the problem
 * - a tab is what holds the stale chunks.
 */
function readDismissed(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage.getItem(DISMISSED_KEY);
  } catch {
    // Private mode, or storage blocked. Showing the banner is the safe default.
    return null;
  }
}

export function UpdateBanner() {
  const [serverBuildId, setServerBuildId] = useState<string | null>(null);
  // Read once, lazily, rather than in an effect. On the server this initialiser
  // returns null and so does the first client render, which is consistent: the
  // banner renders nothing until a check has answered either way.
  const [dismissedBuildId, setDismissedBuildId] = useState<string | null>(readDismissed);
  const pathname = usePathname();

  // The app rendering at all is the proof that recovery worked, so release the
  // once-per-tab guard here. Without this a tab gets one automatic recovery for
  // its entire lifetime and shows the error screen on the second deploy.
  useEffect(clearStaleDeploymentFlag, []);

  useEffect(() => {
    const controller = new AbortController();

    // Resolved in a callback, never awaited in the effect body: only a real
    // answer is recorded. A failed check is not news, and treating it as one
    // would show the banner to everybody during a deploy's own downtime.
    const check = () => {
      void fetchServerBuildId(controller.signal).then((buildId) => {
        if (buildId !== null) setServerBuildId(buildId);
      });
    };

    check();

    const timer = window.setInterval(check, POLL_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
    // `pathname` is in here so navigating also checks: moving between screens is
    // the moment a stale chunk would have been requested anyway.
  }, [pathname]);

  const outdated = isOutdated(serverBuildId);
  const dismissed = serverBuildId !== null && dismissedBuildId === serverBuildId;

  if (!outdated || dismissed) return null;

  const dismiss = () => {
    setDismissedBuildId(serverBuildId);

    try {
      if (serverBuildId) window.sessionStorage.setItem(DISMISSED_KEY, serverBuildId);
    } catch {
      // Nothing to remember it in; it will reappear on the next check.
    }
  };

  return (
    <div
      // `status` rather than `alert`: worth reading, not worth interrupting a
      // screen reader mid-sentence for.
      role="status"
      aria-live="polite"
      // Bottom-LEFT on desktop, deliberately: ToastProvider stacks its own cards
      // bottom-right at the same z-index, and a toast landing on top of a
      // persistent banner hides both messages.
      //
      // Offset past the sidebar at `lg`, where it appears - read from the same
      // `--sidebar-w` variable the main column uses, so this follows the sidebar
      // when it collapses instead of needing its own copy of the width.
      //
      // On mobile both this and the toasts are full-width at the bottom, where a
      // toast can briefly cover this. Acceptable for five seconds, on the
      // breakpoint this screen is least used at.
      className="pointer-events-auto fixed inset-x-4 bottom-4 z-60 mx-auto flex max-w-md flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm transition-[left] duration-200 ease-out sm:inset-x-auto sm:bottom-6 sm:left-6 lg:left-[calc(var(--sidebar-w)+1.5rem)]"
    >
      <div className="flex items-start gap-3">
        <RefreshIcon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">A new version is available</p>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            This tab is running an older build. Update to pick up the latest changes — anything
            you have typed but not saved will be lost.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Not now"
          className="-m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition duration-150 hover:bg-surface-muted"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="flex h-11 items-center rounded-lg px-4 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
        >
          Not now
        </button>
        <button
          type="button"
          // A plain reload, which is all that is needed: the server answers the
          // new HTML, naming the new chunks.
          onClick={() => window.location.reload()}
          className="flex h-11 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
        >
          Update
        </button>
      </div>

      {/* Which build is running, for when somebody reports "I clicked update and
          it is still wrong". Quiet enough to ignore. */}
      <p className="text-xs text-text-muted">
        {CLIENT_BUILD_ID} → {serverBuildId}
      </p>
    </div>
  );
}
