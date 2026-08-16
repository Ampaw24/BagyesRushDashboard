/**
 * State shape for the login form's `useActionState`.
 *
 * This lives outside `actions.ts` because a `"use server"` file may only export
 * async functions — exporting the initial-state object from there is a build
 * error ("A 'use server' file can only export async functions, found object").
 * Types are erased at compile time, but the constant is a real runtime value.
 */
export type LoginState = {
  status: "idle" | "error";
  message: string;
};

export const initialLoginState: LoginState = { status: "idle", message: "" };
