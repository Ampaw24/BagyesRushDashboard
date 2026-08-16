"use client";

import { useLoginForm } from "./_hooks/use-login-form";

export default function LoginForm() {
  const { showPassword, toggleShowPassword, status, errorMessage, sessionExpired, handleSubmit } =
    useLoginForm();

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@bagyesrush.com"
          className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition duration-150 placeholder:text-zinc-400 focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="password" className="text-sm font-medium text-zinc-700">
            Password
          </label>
          <a
            href="#"
            className="break-words text-sm font-medium text-brand transition duration-150 hover:opacity-80"
          >
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 pr-11 text-sm text-zinc-900 outline-none transition duration-150 placeholder:text-zinc-400 focus:border-brand focus:ring-4 focus:ring-brand/10"
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

      {sessionExpired && status !== "error" && (
        <p className="break-words rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
          Your session has ended. Please sign in again.
        </p>
      )}

      {status === "error" && (
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
        {status === "loading" ? "Signing in…" : "Sign in"}
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

