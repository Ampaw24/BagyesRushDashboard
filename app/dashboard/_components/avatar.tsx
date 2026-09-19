"use client";

import { useState } from "react";

import { ImageLightbox } from "./image-lightbox";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Somebody's face, or their initials.
 *
 * `src` is optional because a photo is optional everywhere it appears: a rider
 * uploads one partway through onboarding and a customer may never set one, so
 * initials have to carry every row that has none.
 *
 * A plain `<img>` rather than `next/image`: these are user-uploaded URLs on the
 * API host, and routing them through the optimiser would mean configuring a
 * remote pattern for every environment the backend is deployed to. A broken URL
 * falls back to the initials rather than showing a torn-image glyph, which is
 * the failure that actually happens — storage links go stale.
 *
 * `zoomable` opens the photo full screen. Off by default because in a table the
 * row itself is the thing to click; on wherever an admin is actually inspecting
 * a person, since a 36px circle is not something you can match against a Ghana
 * Card.
 */
export function Avatar({
  name,
  src,
  className = "h-9 w-9 text-xs",
  zoomable = false,
  caption,
}: {
  name: string;
  src?: string | null;
  className?: string;
  zoomable?: boolean;
  caption?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  if (src && !failed) {
    const image = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full border border-border-subtle object-cover ${className}`}
      />
    );

    if (!zoomable) {
      return image;
    }

    return (
      <>
        {/* A button, not a div with a click handler: this has to be reachable
            from the keyboard like any other control. */}
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label={`View ${name}'s photo full size`}
          title="View full size"
          className="group relative shrink-0 rounded-full transition duration-150 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {image}
          <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/5 transition group-hover:ring-brand/40" />
        </button>

        {zoomed && (
          <ImageLightbox
            src={src}
            alt={name}
            caption={caption ?? name}
            onClose={() => setZoomed(false)}
          />
        )}
      </>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand ${className}`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}
