"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { requestPasswordReset, resetPassword } from "@/lib/auth/actions";

const FIELD =
  "h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition duration-150 placeholder:text-zinc-400 focus:border-brand focus:ring-4 focus:ring-brand/10";
const LABEL = "text-sm font-medium text-zinc-700";

/** The backend's own resend cooldown, so the button matches what it will allow. */
const RESEND_SECONDS = 60;

type Step = "phone" | "reset";

/**
 * Ask for a code, then set a new password with it.
 *
 * Two steps on one screen rather than two routes: the phone number typed in
 * step one is what step two has to send back, and a route change is a place to
 * lose it. Nothing is stored — the number stays in component state for the
 * minute or two the flow takes.
 */
export function ForgotPasswordForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  function sendCode() {
    if (!phone.trim()) {
      setError("Enter the phone number on your account.");
      return;
    }

    startTransition(async () => {
      setError("");
      setNotice("");

      const result = await requestPasswordReset(phone.trim());

      if (!result.ok) {
        setError(result.message);
        return;
      }

      // The endpoint names its outcome rather than always claiming success, so
      // "there is no account on that number" is distinguishable from "a code is
      // on its way" — which is the case that actually strands somebody.
      if (!result.data.code_sent) {
        setError(result.message);
        return;
      }

      setNotice(result.message);
      setResendIn(RESEND_SECONDS);
      setStep("reset");
    });
  }

  function submitReset() {
    if (password !== confirmation) {
      setError("The two passwords do not match.");
      return;
    }

    startTransition(async () => {
      setError("");
      setNotice("");

      const result = await resetPassword({
        phone: phone.trim(),
        code: code.trim(),
        password,
        password_confirmation: confirmation,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      // No token is issued by a reset, and every old one was just revoked, so
      // the only thing left to do is sign in with the new password.
      router.push("/login");
    });
  }

  return (
    <div className="flex w-full flex-col gap-5">
      {step === "phone" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className={LABEL}>
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="0244 000 000"
            className={FIELD}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="code" className={LABEL}>
              Reset code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="000000"
              className={`${FIELD} text-center text-lg tracking-[0.4em]`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className={LABEL}>
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className={`${FIELD} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-xs font-medium text-zinc-400 transition duration-150 hover:text-zinc-600"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password_confirmation" className={LABEL}>
              Confirm new password
            </label>
            <input
              id="password_confirmation"
              name="password_confirmation"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Repeat the password"
              className={FIELD}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={sendCode}
              disabled={resendIn > 0 || pending}
              className="text-sm font-medium text-brand transition duration-150 hover:opacity-80 disabled:cursor-not-allowed disabled:text-zinc-400"
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setError("");
                setNotice("");
              }}
              className="text-sm text-zinc-500 transition duration-150 hover:text-zinc-700"
            >
              Change number
            </button>
          </div>
        </>
      )}

      {notice && !error && (
        <p className="break-words rounded-lg bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-600">{notice}</p>
      )}

      {error && (
        <p className="break-words rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>
      )}

      <button
        type="button"
        onClick={step === "phone" ? sendCode : submitReset}
        disabled={pending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Working…" : step === "phone" ? "Send code" : "Set new password"}
      </button>

      <Link
        href="/login"
        className="text-center text-sm font-medium text-zinc-500 transition duration-150 hover:text-zinc-700"
      >
        Back to sign in
      </Link>
    </div>
  );
}
