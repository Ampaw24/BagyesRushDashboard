import type { Metadata } from "next";

import { AuthShell } from "../_components/auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password — BagyesRUSH",
  description: "Recover access to your BagyesRUSH dashboard account.",
};

/**
 * Password recovery, over SMS.
 *
 * Public for the reason the backend route is public: somebody who has
 * forgotten their password has no token to authenticate with. It reuses the
 * same `/password/forgot` + `/password/reset` pair the apps use — one
 * implementation of what a reset means, whoever is doing it.
 */
export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="We will text a code to the number on your account."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
