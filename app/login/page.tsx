import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthShell } from "../_components/auth-shell";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Sign in — BagyesRUSH",
  description: "Sign in to your BagyesRUSH dashboard.",
};

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" description="Sign in to your account to continue.">
      {/* LoginForm reads `?next` and `?expired` via useSearchParams, which
          requires a Suspense boundary to keep this page prerenderable. */}
      <Suspense fallback={<div className="h-[22rem] w-full" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
