"use client";

import { useState } from "react";
import { ImageLightbox } from "../../../_components/image-lightbox";

type Side = { key: "front" | "back"; label: string; src: string | null };

/**
 * The front and back of the rider's vehicle, as the rider uploaded them.
 *
 * Shown beside the vehicle's description so an admin can check the make,
 * colour and plate on the record against the actual bike. Click to enlarge —
 * a plate is not legible at thumbnail size.
 *
 * A plain `<img>`, as `Avatar` and the lightbox use: these are uploaded URLs on
 * the API host, not something the Next optimiser has a remote pattern for.
 */
export function VehiclePhotos({
  front,
  back,
  riderName,
}: {
  front: string | null;
  back: string | null;
  riderName: string;
}) {
  const [preview, setPreview] = useState<Side | null>(null);

  const sides: Side[] = [
    { key: "front", label: "Front", src: front },
    { key: "back", label: "Back", src: back },
  ];

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-text-muted">Photos</span>
      <div className="grid grid-cols-2 gap-3">
        {sides.map((side) =>
          side.src ? (
            <button
              key={side.key}
              type="button"
              onClick={() => setPreview(side)}
              className="group flex flex-col gap-1.5 text-left"
              aria-label={`Enlarge the ${side.label.toLowerCase()} of the vehicle`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={side.src}
                alt={`${riderName}'s vehicle — ${side.label.toLowerCase()}`}
                className="aspect-[4/3] w-full rounded-lg border border-border-subtle object-cover transition duration-150 group-hover:opacity-90"
              />
              <span className="text-xs font-medium text-text-secondary">{side.label}</span>
            </button>
          ) : (
            <div key={side.key} className="flex flex-col gap-1.5">
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-dashed border-border-subtle px-2 text-center text-xs text-text-muted">
                Not uploaded
              </div>
              <span className="text-xs font-medium text-text-secondary">{side.label}</span>
            </div>
          ),
        )}
      </div>

      {preview?.src && (
        <ImageLightbox
          src={preview.src}
          alt={`${riderName}'s vehicle — ${preview.label.toLowerCase()}`}
          caption={`${riderName} · vehicle ${preview.label.toLowerCase()}`}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
