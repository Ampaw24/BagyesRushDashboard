import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export type LoginStatus = "idle" | "loading" | "success" | "error";

export function useLoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function toggleShowPassword() {
    setShowPassword((value) => !value);
  }

  async function submitLogin(email: FormDataEntryValue | null, password: FormDataEntryValue | null) {
    if (!email || !password) {
      setStatus("error");
      setErrorMessage("Enter your email and password to continue.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    // Placeholder for a real authentication request.
    await new Promise((resolve) => setTimeout(resolve, 900));

    setStatus("success");
    router.push("/dashboard");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    void submitLogin(formData.get("email"), formData.get("password"));
  }

  return {
    showPassword,
    toggleShowPassword,
    status,
    errorMessage,
    handleSubmit,
  };
}
