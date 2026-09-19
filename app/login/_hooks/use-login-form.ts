"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useSearchParams } from "next/navigation";

import { login, resendLoginCode } from "@/lib/auth/actions";
import { initialLoginState } from "@/lib/auth/login-state";

export type LoginStatus = "idle" | "loading" | "error";
/** Which half of the sign-in the form is showing. */
export type LoginStep = "credentials" | "code";

/**
 * The two-step sign-in, as a single piece of state.
 *
 * One `useActionState` rather than two: both steps advance the same status, and
 * two hooks would each own a slice of it and disagree the moment a code came
 * back wrong. The server action branches on whether a challenge id is present,
 * so which step this is lives in the state itself rather than in a second flag
 * the form has to keep in step.
 */
export function useLoginForm() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(login, initialLoginState);

  const challenge = state.challenge;
  const step: LoginStep = challenge ? "code" : "credentials";

  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  // When a *resend* said another code would be allowed, as an absolute moment.
  const [resentAt, setResentAt] = useState<{ at: number; seconds: number } | null>(null);

  // The countdown is derived from a moment and a ticking clock rather than
  // stored as a number and decremented. Storing it would mean writing state
  // from an effect every time a challenge arrived — a cascading render, and the
  // thing `react-hooks/set-state-in-effect` exists to catch.
  const now = useTicker(challenge !== undefined);

  const resendAt = resolveResendAt(challenge, resentAt);
  const resendIn = resendAt === null ? 0 : Math.max(0, Math.ceil((resendAt - now) / 1000));

  function toggleShowPassword() {
    setShowPassword((value) => !value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Where the proxy bounced them from, so they resume instead of always
    // landing on the overview.
    const next = searchParams.get("next");
    if (next) formData.set("next", next);

    startTransition(() => formAction(formData));
  }

  const resend = useCallback(async () => {
    if (!challenge || resendIn > 0 || resending) return;

    setResending(true);
    setResendMessage("");

    const result = await resendLoginCode(challenge.id);

    setResendMessage(result.message);
    if (result.ok) setResentAt({ at: Date.now(), seconds: result.data });
    setResending(false);
  }, [challenge, resendIn, resending]);

  const status: LoginStatus = pending ? "loading" : state.status === "error" ? "error" : "idle";

  return {
    step,
    challenge,
    showPassword,
    toggleShowPassword,
    status,
    // On the code step the action reports a wrong code through `message` while
    // keeping `status: "challenge"`, so the banner reads from the message and
    // not from the status.
    errorMessage: state.message,
    // Set when a 401 kicked an active session out, so the screen can explain why.
    sessionExpired: searchParams.get("expired") === "1",
    handleSubmit,
    resend,
    resendIn,
    resending,
    resendMessage,
  };
}

/** A clock that ticks once a second while `active`, and stops when it is not. */
function useTicker(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);

  return now;
}

/**
 * When another code may be requested, as an absolute moment.
 *
 * A resend keeps the same challenge id, so its own window has to win — but only
 * while it is newer than the challenge the form is currently holding, or a
 * fresh sign-in would inherit the previous attempt's countdown.
 */
function resolveResendAt(
  challenge: { issuedAt: number; resendAvailableIn: number } | undefined,
  resent: { at: number; seconds: number } | null,
): number | null {
  if (!challenge) return null;

  if (resent && resent.at >= challenge.issuedAt) {
    return resent.at + resent.seconds * 1000;
  }

  return challenge.issuedAt + challenge.resendAvailableIn * 1000;
}
