"use client";

import Link from "next/link";

import { useLoginForm } from "./_hooks/use-login-form";

const FIELD =
  "h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition duration-150 placeholder:text-zinc-400 focus:border-brand focus:ring-4 focus:ring-brand/10";

export default function LoginForm() {
  const {
    step,
    challenge,
    showPassword,
    toggleShowPassword,
    status,
    errorMessage,
    sessionExpired,
    handleSubmit,
    resend,
    resendIn,
    resending,
    resendMessage,
  } = useLoginForm();

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5" noValidate>
      {step === "credentials" ? (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-sm font-medium text-zinc-700">
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0244 000 000"
              className={FIELD}
            />
            <p className="break-words text-xs text-zinc-500">
              We text a sign-in code to this number.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="password" className="text-sm font-medium text-zinc-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="break-words text-sm font-medium text-brand transition duration-150 hover:opacity-80"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`${FIELD} pr-11`}
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-zinc-400 transition duration-150 hover:text-zinc-600"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              name="remember"
              className="h-4 w-4 rounded border-zinc-300 text-brand focus:ring-brand"
            />
            Remember me for 30 days
          </label>
        </>
      ) : (
        <>
          {/* The challenge travels back with the code so a mistyped digit costs
              a retry rather than the whole sign-in. It is opaque and carries no
              account information, which is what makes that safe. */}
          <input type="hidden" name="challenge_id" value={challenge?.id ?? ""} />
          <input type="hidden" name="phone_hint" value={challenge?.phoneHint ?? ""} />
          <input type="hidden" name="resend_available_in" value={challenge?.resendAvailableIn ?? 0} />
          <input type="hidden" name="issued_at" value={challenge?.issuedAt ?? 0} />
          {/* Carried from step one so the choice made before the code arrived
              is the one honoured when the cookie is finally written. Omitted
              rather than sent as "0", because the action reads the field's
              presence — which is how an unchecked checkbox behaves. */}
          {challenge?.remember && <input type="hidden" name="remember" value="1" />}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="code" className="text-sm font-medium text-zinc-700">
              Sign-in code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder="000000"
              className={`${FIELD} text-center text-lg tracking-[0.4em]`}
            />
            <p className="break-words text-xs text-zinc-500">
              {challenge?.phoneHint
                ? `Sent to ${challenge.phoneHint}. It expires in a few minutes.`
                : "Enter the code we texted you. It expires in a few minutes."}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={resend}
              disabled={resendIn > 0 || resending}
              className="text-sm font-medium text-brand transition duration-150 hover:opacity-80 disabled:cursor-not-allowed disabled:text-zinc-400"
            >
              {resendIn > 0
                ? `Resend code in ${resendIn}s`
                : resending
                  ? "Sending…"
                  : "Resend code"}
            </button>
            <button
              type="button"
              // A reload rather than a link, so `?next` survives: somebody
              // bounced here from a deep page should still land back on it.
              onClick={() => window.location.reload()}
              className="text-sm text-zinc-500 transition duration-150 hover:text-zinc-700"
            >
              Start over
            </button>
          </div>

          {resendMessage && (
            <p className="break-words rounded-lg bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-600">
              {resendMessage}
            </p>
          )}
        </>
      )}

      {sessionExpired && !errorMessage && (
        <p className="break-words rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
          Your session has ended. Please sign in again.
        </p>
      )}

      {errorMessage && (
        <p className="break-words rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" && <SpinnerIcon />}
        {status === "loading"
          ? step === "credentials"
            ? "Sending code…"
            : "Verifying…"
          : step === "credentials"
            ? "Continue"
            : "Sign in"}
      </button>
    </form>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a13.16 13.16 0 0 1-3.05 3.94M6.1 6.1C3.62 7.86 1.99 10.5 1 11.98a13.16 13.16 0 0 0 3.05 3.94M9.53 9.53a3 3 0 0 0 4.24 4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-brand-foreground"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4Z" />
    </svg>
  );
}
