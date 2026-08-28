import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import LoginForm from "./login-form";
import logo from "@/public/icon.jpeg";

export const metadata: Metadata = {
  title: "Sign in — BagyesRUSH",
  description: "Sign in to your BagyesRUSH dashboard.",
};

const highlights = [
  { label: "Live order and rider tracking" },
  { label: "Route planning built for rush hours" },
  { label: "Instant delivery status updates" },
];

export default function LoginPage() {
  return (
    <div className="grid w-full flex-1 lg:grid-cols-2">
      <section
        className="animate-intro hidden flex-col justify-between bg-brand bg-repeat p-12 text-white lg:flex"
        style={{ backgroundImage: "url('/delivery-pattern.svg')", backgroundSize: "120px 120px" }}
      >
        <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl">
          <Image src={logo} alt="BagyesRUSH" width={96} height={96} className="h-full w-full object-contain" priority />
        </span>

        <div className="flex flex-col gap-6 rounded-2xl border border-white/15 bg-white/10 p-8">
          <h1 className="max-w-md break-words text-4xl font-semibold leading-tight tracking-tight">
            Every delivery, tracked in real time.
          </h1>
          <p className="max-w-sm break-words text-base leading-7 text-white/80">
            Manage orders, riders, and routes from one dashboard built for rush delivery.
          </p>
          <ul className="flex flex-col gap-3 pt-2">
            {highlights.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span className="break-words">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <blockquote className="break-words border-t border-white/20 pt-6 text-sm text-white/80">
          &ldquo;BagyesRUSH cut our average delivery time by 30%.&rdquo;
          <footer className="mt-2 text-white/60">— Operations Lead, BagyesRUSH</footer>
        </blockquote>
      </section>

      <section className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-12 sm:px-10">
        <div className="animate-intro-delay flex w-full max-w-sm flex-col gap-8 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-2">
            <span className="mb-2 flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl lg:hidden">
              <Image src={logo} alt="BagyesRUSH" width={80} height={80} className="h-full w-full object-contain" priority />
            </span>
            <h2 className="break-words text-2xl font-semibold tracking-tight text-zinc-900">
              Welcome back
            </h2>
            <p className="break-words text-sm text-zinc-500">
              Sign in to your account to continue.
            </p>
          </div>

          {/* LoginForm reads `?next` and `?expired` via useSearchParams, which
              requires a Suspense boundary to keep this page prerenderable. */}
          <Suspense fallback={<div className="h-[22rem] w-full" />}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
