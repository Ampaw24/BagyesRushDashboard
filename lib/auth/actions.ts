"use server";

import { redirect } from "next/navigation";

import { apiFetch } from "../api/client";
import { toErrorMessage } from "../api/errors";
import type { LoginResponseDto } from "../types/api";
import type { LoginState } from "./login-state";
import { setSessionToken } from "./session";

/**
 * Exchanges credentials for a Sanctum token and stores it in an httpOnly cookie.
 *
 * Only `role === "admin"` accounts may hold a dashboard session. The backend
 * would reject them at the `role:admin` middleware anyway, but stopping here
 * means a customer never gets a cookie and a confusing empty dashboard.
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") !== null;

  if (!email || !password) {
    return { status: "error", message: "Enter your email and password to continue." };
  }

  let session: LoginResponseDto;
  try {
    session = await apiFetch<LoginResponseDto>("/login", {
      method: "POST",
      body: { email, password },
      anonymous: true,
    });
  } catch (error) {
    // The backend reports bad credentials, unverified numbers and suspended
    // accounts all as 422 with a usable message, so surfacing it is enough.
    return { status: "error", message: toErrorMessage(error) };
  }

  if (session.user.role !== "admin") {
    return { status: "error", message: "This account does not have dashboard access." };
  }

  await setSessionToken(session.access_token, remember);

  // Throws NEXT_REDIRECT, so nothing below runs.
  redirect(safeNext(formData.get("next")));
}

/**
 * Only ever redirect to a path inside the dashboard. Taking the raw value would
 * let a crafted `?next=https://evil.example` turn the login form into an open
 * redirect.
 */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/dashboard") && !next.startsWith("//") ? next : "/dashboard";
}

/**
 * Revokes the token server-side, then hands off to the /logout Route Handler
 * to clear the cookie and land on the login screen.
 */
export async function logout(): Promise<void> {
  try {
    await apiFetch<null>("/logout", { method: "POST" });
  } catch {
    // A token that is already invalid still has to clear locally, so a failure
    // here is not worth blocking the sign-out on.
  }

  redirect("/logout");
}
