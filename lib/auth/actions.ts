"use server";

import { redirect } from "next/navigation";

import { apiAction } from "../api/action";
import { apiFetch } from "../api/client";
import { actionFailure, toErrorMessage, type ActionResult } from "../api/errors";
import type { AdminLoginChallengeDto, LoginResponseDto } from "../types/api";
import type { LoginState } from "./login-state";
import { setSessionToken } from "./session";

/**
 * Signing in to the dashboard, in two steps.
 *
 * The apps trade a password for a token in one call, which is the right shape
 * for a phone in somebody's pocket. This screen can refund a payment and read
 * where every vendor's money goes, so the password only earns a code here and
 * the code is what mints the session — `POST /v1/admin/auth/*` on the backend.
 *
 * Both steps run as Server Actions, so the Sanctum token never touches client
 * JavaScript: it goes straight from the API into an httpOnly cookie.
 */

/**
 * The one action the form dispatches, whichever step it is on.
 *
 * `useActionState` binds a single function, and both steps advance the same
 * piece of state, so branching here keeps the form a state machine with one
 * reducer rather than two hooks racing to own `status`. The presence of a
 * challenge id is what says which step this submission is.
 */
export async function login(prev: LoginState, formData: FormData): Promise<LoginState> {
  return formData.get("challenge_id") ? verifyLogin(prev, formData) : startLogin(prev, formData);
}

/**
 * Step one. Checks the password and texts a code; returns a challenge, never a
 * session.
 */
export async function startLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") !== null;

  if (!phone || !password) {
    return { status: "error", message: "Enter your phone number and password to continue." };
  }

  try {
    const challenge = await apiFetch<AdminLoginChallengeDto>("/admin/auth/login", {
      method: "POST",
      body: { phone, password },
      anonymous: true,
    });

    return {
      status: "challenge",
      // The backend names the outcome; a suspended or deleted account is told
      // what happened to it rather than blamed for its password.
      message: "",
      challenge: {
        id: challenge.challenge_id,
        phoneHint: challenge.phone_hint,
        resendAvailableIn: challenge.resend_available_in,
        issuedAt: Date.now(),
        remember,
      },
    };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}

/**
 * Step two. The only call in this flow that produces a cookie.
 *
 * `remember` rides along from step one's form so the choice the admin made
 * before the code arrived is the one that is honoured.
 */
export async function verifyLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const challengeId = String(formData.get("challenge_id") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const remember = formData.get("remember") !== null;

  if (!challengeId) {
    return { status: "error", message: "That sign-in attempt has expired. Please start again." };
  }

  if (!code) {
    return {
      status: "challenge",
      message: "Enter the code we sent to your phone.",
      challenge: rememberChallenge(formData),
    };
  }

  let session: LoginResponseDto;
  try {
    session = await apiFetch<LoginResponseDto>("/admin/auth/verify-otp", {
      method: "POST",
      body: { challenge_id: challengeId, code },
      anonymous: true,
    });
  } catch (error) {
    // Stay on the code step: a mistyped digit should not throw away a valid
    // challenge and make somebody re-enter their password.
    return {
      status: "challenge",
      message: toErrorMessage(error),
      challenge: rememberChallenge(formData),
    };
  }

  // Belt and braces. The backend already refuses a non-staff account before it
  // sends a code, but a customer holding a dashboard cookie would see an empty
  // shell rather than an explanation.
  if (session.user.role !== "admin") {
    return { status: "error", message: "This account does not have dashboard access." };
  }

  await setSessionToken(session.access_token, remember);

  // Throws NEXT_REDIRECT, so nothing below runs.
  redirect(safeNext(formData.get("next")));
}

/** Another code, on the same challenge. */
export async function resendLoginCode(challengeId: string): Promise<ActionResult<number>> {
  try {
    const challenge = await apiFetch<AdminLoginChallengeDto>("/admin/auth/resend-otp", {
      method: "POST",
      body: { challenge_id: challengeId },
      anonymous: true,
    });

    return {
      ok: true,
      data: challenge.resend_available_in,
      message: "We have sent another code to your phone.",
    };
  } catch (error) {
    return actionFailure(error);
  }
}

// --- Password recovery ------------------------------------------------------

/**
 * Texts a reset code. Public on the backend for the obvious reason: somebody
 * who has forgotten their password has no token to authenticate with.
 *
 * The response names its outcome (`sent`, `not_registered`, ...) rather than
 * always claiming success, so the screen can tell "a code is on its way" from
 * "there is no account on that number".
 */
export async function requestPasswordReset(phone: string): Promise<ActionResult<PasswordResetSend>> {
  return apiAction("A code is on its way.", async () =>
    apiFetch<PasswordResetSend>("/password/forgot", {
      method: "POST",
      body: { phone },
      anonymous: true,
    }),
  );
}

/**
 * `status` is the enum the backend publishes (`sent`, `already_verified`,
 * `not_registered`, `invalid_number`) so a screen can tell a code being sent
 * from nothing happening — the two cases a fixed "if that number exists..."
 * string made indistinguishable.
 */
type PasswordResetSend = {
  status: string;
  code_sent: boolean;
};

export async function resetPassword(input: {
  phone: string;
  code: string;
  password: string;
  password_confirmation: string;
}): Promise<ActionResult<unknown>> {
  return apiAction("Password updated. Please sign in with your new password.", async () =>
    apiFetch<unknown>("/password/reset", { method: "POST", body: input, anonymous: true }),
  );
}

/**
 * Carries the challenge across a failed code attempt, so a wrong digit costs a
 * retry rather than the whole sign-in.
 */
function rememberChallenge(formData: FormData): LoginState["challenge"] {
  return {
    id: String(formData.get("challenge_id") ?? ""),
    phoneHint: (formData.get("phone_hint") as string | null) || null,
    resendAvailableIn: Number(formData.get("resend_available_in") ?? 0),
    issuedAt: Number(formData.get("issued_at") ?? Date.now()),
    remember: formData.get("remember") !== null,
  };
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
