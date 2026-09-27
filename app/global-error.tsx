"use client";

import { useEffect } from "react";

import { recoverFromStaleDeployment } from "@/lib/http/chunk-recovery";

/**
 * The last line of defence.
 *
 * `app/dashboard/error.tsx` only catches failures inside the dashboard segment.
 * Anything that breaks in the root layout, on /login, or before a segment
 * boundary exists fell through to Next's built-in page — which in production is
 * an unstyled screen showing a minified error digest and nothing anybody can
 * act on.
 *
 * This replaces its own <html> because a global error boundary renders instead
 * of the root layout, not inside it.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // A deploy landing underneath an open tab is the common cause here, and it
    // fixes itself with a reload. Do that before showing anybody an error.
    if (recoverFromStaleDeployment(error)) return;

    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "#fafaf9",
          color: "#1c1917",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "#57534e", margin: 0 }}>
            The dashboard hit an error it could not recover from. Trying again usually works — if it
            keeps happening, the reference below will identify it in the logs.
          </p>

          {/* The digest is the only thing tying this screen to the server-side
              stack trace, so it is shown rather than hidden. */}
          {error.digest && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#a8a29e",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                margin: "1rem 0 0",
              }}
            >
              Reference: {error.digest}
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              marginTop: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                height: "2.75rem",
                padding: "0 1.25rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "#1c1917",
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/dashboard"
              style={{
                height: "2.75rem",
                padding: "0 1.25rem",
                borderRadius: "0.5rem",
                border: "1px solid #e7e5e4",
                color: "#57534e",
                fontSize: "0.875rem",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              Back to dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
