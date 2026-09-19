"use client";

import { useEffect, useRef, useState } from "react";

import { useToast } from "./toast-provider";
import { DownloadIcon, ExportIcon, MailIcon, WhatsappIcon } from "../_lib/icons";

type Format = "xlsx" | "pdf" | "csv";

/**
 * Export this screen.
 *
 * Sends whatever filters are on screen, so the file matches what the admin is
 * looking at rather than the whole table — the backend applies them through the
 * same service the list uses.
 *
 * Email is rendered disabled with its reason rather than hidden when no mailer
 * is configured: a button that vanishes reads as a missing feature, while one
 * that explains itself reads as a setting somebody has to turn on.
 */
export function ExportMenu({
  resource,
  filters = {},
  emailEnabled = false,
  label = "Export",
}: {
  resource: string;
  filters?: Record<string, string | number | boolean | undefined>;
  emailEnabled?: boolean;
  label?: string;
}) {
  const { notify } = useToast();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [emailing, setEmailing] = useState(false);
  const [address, setAddress] = useState("");
  const container = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const close = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) {
        setOpen(false);
        setEmailing(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const query = (format: Format, channel: string, extra: Record<string, string> = {}) => {
    const params = new URLSearchParams({ resource, format, channel, ...extra });

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }

    return params.toString();
  };

  const download = async (format: Format) => {
    setBusy(format);

    try {
      const response = await fetch(`/api/export?${query(format, "download")}`, { method: "POST" });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "The export failed." }));
        notify({ ok: false, message: body.message ?? "The export failed." });
        return;
      }

      // Read the name the backend chose rather than inventing one, so an
      // exported file is identifiable a week later in a downloads folder.
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename = /filename="?([^"]+)"?/.exec(disposition)?.[1] ?? `${resource}.${format}`;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();

      URL.revokeObjectURL(url);

      notify({ ok: true, message: `${filename} downloaded.` });
      setOpen(false);
    } catch {
      notify({ ok: false, message: "The export could not be generated." });
    } finally {
      setBusy(null);
    }
  };

  const sendEmail = async (format: Format) => {
    if (!address.trim()) {
      notify({ ok: false, message: "Enter an address to send it to." });
      return;
    }

    setBusy("email");

    try {
      const response = await fetch(`/api/export?${query(format, "email", { email: address.trim() })}`, {
        method: "POST",
      });
      const body = await response.json().catch(() => ({}));

      notify({ ok: response.ok, message: body.message ?? "The export could not be sent." });

      if (response.ok) {
        setOpen(false);
        setEmailing(false);
        setAddress("");
      }
    } catch {
      notify({ ok: false, message: "The export could not be sent." });
    } finally {
      setBusy(null);
    }
  };

  const shareToWhatsapp = async (format: Format) => {
    setBusy("whatsapp");

    try {
      const response = await fetch(`/api/export?${query(format, "whatsapp")}`, { method: "POST" });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        notify({ ok: false, message: body.message ?? "The share link could not be created." });
        return;
      }

      // WhatsApp opens with the message ready; the admin picks the recipient.
      window.open(body.data.share_url, "_blank", "noopener,noreferrer");
      setOpen(false);
    } catch {
      notify({ ok: false, message: "The share link could not be created." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm font-medium transition hover:border-brand hover:text-brand"
      >
        <ExportIcon className="h-4 w-4" />
        {label}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-lg">
          <p className="border-b border-border-subtle px-3 py-2 text-xs text-text-muted">
            Exports what is on screen, filters included.
          </p>

          <Group label="Download">
            <Row icon={DownloadIcon} busy={busy === "xlsx"} onClick={() => download("xlsx")}>
              Excel spreadsheet
            </Row>
            <Row icon={DownloadIcon} busy={busy === "pdf"} onClick={() => download("pdf")}>
              PDF document
            </Row>
            <Row icon={DownloadIcon} busy={busy === "csv"} onClick={() => download("csv")}>
              CSV file
            </Row>
          </Group>

          <Group label="Share">
            <Row icon={WhatsappIcon} busy={busy === "whatsapp"} onClick={() => shareToWhatsapp("pdf")}>
              Send on WhatsApp
            </Row>

            {emailEnabled ? (
              emailing ? (
                <div className="flex flex-col gap-2 px-3 py-2">
                  <input
                    type="email"
                    autoFocus
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="name@example.com"
                    className="h-9 w-full rounded-lg border border-border-subtle bg-surface px-2 text-sm outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    disabled={busy === "email"}
                    onClick={() => sendEmail("xlsx")}
                    className="h-9 rounded-lg bg-brand text-sm font-medium text-white disabled:opacity-60"
                  >
                    {busy === "email" ? "Sending…" : "Send spreadsheet"}
                  </button>
                </div>
              ) : (
                <Row icon={MailIcon} onClick={() => setEmailing(true)}>
                  Send by email
                </Row>
              )
            ) : (
              <div
                className="flex cursor-not-allowed items-center gap-2.5 px-3 py-2 text-sm text-text-muted opacity-60"
                title="No mail server is configured on this deployment, so email would go nowhere."
              >
                <MailIcon className="h-4 w-4" />
                Email — not configured
              </div>
            )}
          </Group>
        </div>
      ) : null}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border-subtle last:border-b-0">
      <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      {children}
    </div>
  );
}

function Row({
  icon: Icon,
  busy,
  onClick,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  busy?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-surface-muted disabled:opacity-60"
    >
      <Icon className="h-4 w-4 text-text-muted" />
      {busy ? "Preparing…" : children}
    </button>
  );
}
