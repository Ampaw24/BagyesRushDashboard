import type { FieldErrors } from "../api/errors";

/**
 * State shape for the login form's `useActionState`.
 *
 * This lives outside `actions.ts` because a `"use server"` file may only export
 * async functions — exporting the initial-state object from there is a build
 * error ("A 'use server' file can only export async functions, found object").
 * Types are erased at compile time, but the constant is a real runtime value.
 *
 * Signing in is two steps now, so the state is a small machine rather than a
 * flag. `challenge` is what step two answers against; it is opaque and carries
 * no account information, which is why it is safe to hold in client state.
 */
export type LoginState = {
  status: "idle" | "error" | "challenge";
  message: string;
  /** Present once a code has been sent. Absent means we are still on step one. */
  challenge?: {
    id: string;
    /** The number masked to its last four digits, e.g. `********0000`. */
    phoneHint: string | null;
    /** Seconds to wait before another code may be requested. */
    resendAvailableIn: number;
    /** Bumped on every resend so the form knows to restart its countdown. */
    issuedAt: number;
    /**
     * The "remember me" choice made on step one.
     *
     * Carried through rather than re-asked, because the checkbox is on the
     * screen the admin has already left by the time the code arrives — and
     * defaulting it either way would quietly override what they picked.
     */
    remember: boolean;
  };
  errors?: FieldErrors;
};

export const initialLoginState: LoginState = { status: "idle", message: "" };
