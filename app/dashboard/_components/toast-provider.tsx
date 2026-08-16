"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { CheckCircleIcon, CloseIcon, DangerIcon } from "../_lib/icons";
import type { ActionResult } from "@/lib/api/errors";

export type ToastTone = "success" | "error";

type Toast = { id: number; tone: ToastTone; message: string };

type ToastContextValue = {
  /** Show an arbitrary message. */
  showToast: (message: string, tone?: ToastTone) => void;
  /**
   * Report a Server Action result using the backend's own message — the
   * "Vendor approved" / "The last super administrator cannot be demoted."
   * wording comes straight from the API rather than being reinvented here.
   */
  notify: (result: Pick<ActionResult, "ok" | "message"> | { ok: boolean; message: string }) => void;
  /**
   * For dialogs and forms, which already render the failure inline and keep
   * themselves open — toasting it as well would report the same problem twice.
   */
  notifySuccess: (result: { ok: boolean; message: string }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/** How long a toast stays before dismissing itself. */
const DISMISS_AFTER_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      if (!message) return;

      const id = nextId.current++;
      setToasts((current) => [...current, { id, tone, message }]);
      setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
    },
    [dismiss],
  );

  const notify = useCallback<ToastContextValue["notify"]>(
    (result) => showToast(result.message, result.ok ? "success" : "error"),
    [showToast],
  );

  const notifySuccess = useCallback<ToastContextValue["notifySuccess"]>(
    (result) => {
      if (result.ok) showToast(result.message, "success");
    },
    [showToast],
  );

  const value = useMemo(
    () => ({ showToast, notify, notifySuccess }),
    [showToast, notify, notifySuccess],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Above dialogs (z-50) so a toast raised from inside one is still read. */}
      <div
        // `polite` rather than `assertive`: these confirm an action the admin
        // just took, so they should not interrupt what a screen reader is saying.
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-60 flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const isError = toast.tone === "error";
  const Icon = isError ? DangerIcon : CheckCircleIcon;

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`animate-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface p-4 shadow-sm ${
        isError ? "border-status-critical/30" : "border-border-subtle"
      }`}
    >
      <Icon
        className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${isError ? "text-status-critical" : "text-status-good"}`}
      />
      <p className="flex-1 break-words text-sm text-foreground">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition duration-150 hover:bg-surface-muted"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside the dashboard's ToastProvider.");
  }
  return context;
}
