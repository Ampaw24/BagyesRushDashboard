import Image from "next/image";
import type { ReactNode } from "react";

import logo from "@/public/icon.jpeg";

const highlights = [
  "Live order and rider tracking",
  "Route planning built for rush hours",
  "Instant delivery status updates",
];

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

/**
 * The split screen every signed-out page uses.
 *
 * Extracted when password recovery arrived: the brand panel, the logo
 * treatment and the card are identical on both screens, and two copies is two
 * places for them to drift the next time the wording changes.
 */
export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="grid w-full flex-1 lg:grid-cols-2">
      <section
        className="animate-intro hidden flex-col justify-center gap-10 bg-brand bg-repeat p-12 text-white lg:flex"
        style={{ backgroundImage: "url('/delivery-pattern.svg')", backgroundSize: "120px 120px" }}
      >
        <Wordmark />

        <ul className="flex flex-col gap-3.5">
          {highlights.map((item) => (
            <li key={item} className="flex items-center gap-3 text-base text-white/90">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span className="break-words">{item}</span>
            </li>
          ))}
        </ul>

        <blockquote className="mt-auto break-words border-t border-white/20 pt-6 text-sm text-white/80">
          &ldquo;BagyesRUSH cut our average delivery time by 30%.&rdquo;
          <footer className="mt-2 text-white/60">— Operations Lead, BagyesRUSH</footer>
        </blockquote>
      </section>

      <section className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-12 sm:px-10">
        <div className="animate-intro-delay flex w-full max-w-sm flex-col gap-8 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-2">
            {/* The brand panel is hidden below `lg`, so the mark has to appear
                here or a phone gets an unbranded form. */}
            <span className="mb-3 flex items-center gap-3 lg:hidden">
              <LogoPlate size="sm" />
              <span className="break-words text-xl font-bold tracking-tight text-zinc-900">
                Bagyes<span className="text-brand">RUSH</span>
              </span>
            </span>
            <h2 className="break-words text-2xl font-semibold tracking-tight text-zinc-900">{title}</h2>
            <p className="break-words text-sm text-zinc-500">{description}</p>
          </div>

          {children}
        </div>
      </section>
    </div>
  );
}

/**
 * The mark, then the name.
 *
 * Stacked rather than side by side: the logo is a square, and a square next to
 * a long word leaves the word floating. Sizes are in `rem` and step down at
 * narrower desktop widths so the wordmark never has to wrap — "BagyesRUSH"
 * broken across two lines stops being a wordmark.
 */
function Wordmark() {
  return (
    <div className="flex flex-col gap-4">
      <LogoPlate size="lg" />

      <div className="flex flex-col gap-3">
        <p className="break-words text-[2.75rem] font-bold leading-none tracking-tight xl:text-6xl">
          Bagyes<span className="text-white/80">RUSH</span>
        </p>
        <p className="max-w-md break-words text-lg leading-8 text-white/80">
          Every delivery, tracked in real time. Manage orders, riders and routes from one dashboard
          built for rush hours.
        </p>
      </div>
    </div>
  );
}

/**
 * The logo.
 *
 * `icon.jpeg` is a JPEG, so it carries an opaque background — and that
 * background is the same brand red as this panel. So no plate and no rounding
 * on the brand side: the artwork sits straight on the panel and the edge
 * disappears, which is why it can be this large without looking like a sticker.
 *
 * On the light card it needs the opposite treatment — a red square on white is
 * a visible block, so there it keeps a rounded crop.
 */
function LogoPlate({ size }: { size: "sm" | "lg" }) {
  if (size === "lg") {
    return (
      <Image
        src={logo}
        alt="BagyesRUSH"
        width={200}
        height={200}
        className="h-36 w-36 shrink-0 object-contain xl:h-44 xl:w-44"
        priority
      />
    );
  }

  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl">
      <Image
        src={logo}
        alt="BagyesRUSH"
        width={96}
        height={96}
        className="h-full w-full object-cover"
        priority
      />
    </span>
  );
}
