"use client";

import { useEffect, useState } from "react";

/**
 * A user-uploaded image at a size somebody can actually judge.
 *
 * Profile photos are the evidence an admin approves a rider on — that the face
 * matches the Ghana Card, that the plate in the background is the one on the
 * record — and a 36px circle is not something you can judge any of that from.
 *
 * A plain `<img>` for the same reason `Avatar` uses one: these are uploaded
 * URLs on the API host, and routing them through the Next optimiser would mean
 * a remote pattern per environment.
 */
export function ImageLightbox({
  src,
  alt,
  caption,
  onClose,
}: {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}) {
  const [failed, setFailed] = useState(false);

  // Escape closes it, and the page behind does not scroll while it is open —
  // otherwise dismissing a full-screen image leaves you somewhere else.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      <div className="relative flex max-h-full w-full max-w-3xl flex-col items-center gap-3">
        {failed ? (
          // A KYC document can be a PDF, and a storage link can go stale.
          // Either way the original still opens — saying so beats a torn-image
          // glyph the admin cannot act on.
          <div className="flex w-full flex-col items-center gap-2 rounded-xl bg-white/10 px-6 py-16 text-center">
            <p className="text-sm font-medium text-white">No preview available</p>
            <p className="text-sm text-white/70">
              This may be a PDF, or the file may have moved. Open the original to see it.
            </p>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            onError={() => setFailed(true)}
            className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
          />
        )}

        <div className="flex w-full flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="break-words text-sm text-white/90">{caption ?? alt}</p>

          <div className="flex items-center gap-2">
            {/* The original, for anything the viewer above shrinks — a licence
                number has to be legible to be checked. */}
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 items-center rounded-lg bg-white/10 px-4 text-sm font-medium text-white transition duration-150 hover:bg-white/20"
            >
              Open original
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 items-center rounded-lg bg-white px-4 text-sm font-semibold text-zinc-900 transition duration-150 hover:bg-white/90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
