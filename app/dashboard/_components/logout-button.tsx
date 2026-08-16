"use client";

import { startTransition, useActionState } from "react";

import { logout } from "@/lib/auth/actions";
import { LogoutIcon } from "../_lib/icons";

/**
 * Signing out is a mutation, not a link: it revokes the token on the backend
 * and clears the httpOnly cookie, neither of which a `<Link href="/login">`
 * can do. The sidebar, the mobile drawer and the profile menu all use this.
 */
export function LogoutButton({
  showLabel = true,
  className,
  onDone,
}: {
  showLabel?: boolean;
  className?: string;
  onDone?: () => void;
}) {
  const [, action, pending] = useActionState(async () => {
    await logout();
  }, undefined);

  return (
    <button
      type="button"
      disabled={pending}
      title="Log out"
      onClick={() => {
        onDone?.();
        startTransition(() => action());
      }}
      className={
        className ??
        `flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:opacity-60 ${
          showLabel ? "" : "justify-center px-0"
        }`
      }
    >
      <LogoutIcon className="h-5 w-5 shrink-0" />
      {showLabel && <span>{pending ? "Signing out…" : "Log out"}</span>}
      {!showLabel && <span className="sr-only">Log out</span>}
    </button>
  );
}
