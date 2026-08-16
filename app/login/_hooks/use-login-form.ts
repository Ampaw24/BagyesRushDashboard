"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import { login } from "@/lib/auth/actions";
import { initialLoginState } from "@/lib/auth/login-state";

export type LoginStatus = "idle" | "loading" | "error";

export function useLoginForm() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(login, initialLoginState);

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

  const status: LoginStatus = pending ? "loading" : state.status === "error" ? "error" : "idle";

  return {
    showPassword,
    toggleShowPassword,
    status,
    errorMessage: state.message,
    // Set when a 401 kicked an active session out, so the screen can explain why.
    sessionExpired: searchParams.get("expired") === "1",
    handleSubmit,
  };
}
