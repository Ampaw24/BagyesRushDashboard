"use client";

import { useRef, useState } from "react";

import { EmptyState } from "../../../_components/empty-state";
import { useToast } from "../../../_components/toast-provider";
import { uploadVendorImageAction } from "../../_actions";
import type { VendorImageType } from "@/lib/services/vendors.service";
import type { VendorDetail } from "@/lib/mappers/vendor.mapper";

/**
 * Everything the vendor uploaded or typed about how they present themselves.
 *
 * This tab was read-only on the argument that quietly rewriting somebody's
 * branding from the back office is not a power the screen should have, and that
 * moderation is what pulling a vendor offline is for.
 *
 * That was half right, and the wrong half was "quietly". The reasoning left
 * staff with one lever - suspend the whole kitchen, taking it out of every
 * customer's search results and stopping its orders - for a problem that is one
 * broken or unusable file. A vendor whose logo fails to load is not a vendor
 * who should be offline.
 *
 * So replacing is allowed, and the objection is answered where it actually
 * bites: it needs `vendors.update`, so support cannot do it; every upload is
 * written to admin_activity_log with the admin who did it; and the control says
 * plainly that it replaces what the vendor chose. Nothing about it is quiet.
 *
 * The text below stays read-only. A description is the vendor's own words, and
 * there is no equivalent "it is broken" failure to justify overwriting them.
 */
export function MediaTab({
  vendor,
  canUpdate = false,
}: {
  vendor: VendorDetail;
  /** `vendors.update`. Without it the tab is exactly what it used to be. */
  canUpdate?: boolean;
}) {
  const images: {
    label: string;
    url: string | null;
    hint: string;
    aspect: string;
    type: VendorImageType;
  }[] = [
    {
      label: "Logo",
      type: "logo",
      url: vendor.logoUrl,
      hint: "Shown on the vendor card and next to every order.",
      aspect: "aspect-square",
    },
    {
      label: "Cover image",
      type: "cover",
      url: vendor.coverImageUrl,
      hint: "The banner across the top of their storefront.",
      aspect: "aspect-[3/1]",
    },
    {
      label: "Storefront image",
      type: "banner",
      url: vendor.imageUrl,
      hint: "Used in listings where a cover would be too wide.",
      aspect: "aspect-[4/3]",
    },
  ];

  const uploaded = images.filter((image) => image.url).length;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Images</h3>
          <span className="text-xs text-text-muted">
            {uploaded} of {images.length} uploaded
          </span>
        </div>

        {uploaded === 0 && !canUpdate ? (
          <EmptyState
            title="No images uploaded"
            description="This vendor has not added a logo, cover or storefront image yet. Customers see a placeholder until they do."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {images.map((image) => (
              <figure
                key={image.label}
                className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm"
              >
                <div
                  className={`${image.aspect} w-full overflow-hidden rounded-lg border border-border-subtle bg-surface-muted`}
                >
                  {image.url ? (
                    // A plain <img>: these are vendor-uploaded URLs on the
                    // public disk, and next/image would need every possible
                    // host allow-listed in next.config.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.url}
                      alt={`${vendor.businessName} ${image.label.toLowerCase()}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-text-muted">
                      Not uploaded
                    </div>
                  )}
                </div>

                <figcaption className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{image.label}</span>
                  <span className="text-xs text-text-muted">{image.hint}</span>
                  {image.url ? (
                    <a
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-xs text-brand hover:underline"
                    >
                      Open full size
                    </a>
                  ) : null}

                  {canUpdate && (
                    <ReplaceImage
                      vendorId={vendor.id}
                      type={image.type}
                      label={image.label}
                      hasExisting={Boolean(image.url)}
                    />
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">How they describe themselves</h3>

        <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
          <Field label="Description" value={vendor.description} multiline />
          <Field label="Promotional text" value={vendor.promoText} />
          <Field
            label="Categories"
            value={vendor.categories.length > 0 ? vendor.categories.join(", ") : null}
            // Categories are how a customer finds them at all, so an empty one
            // is worth flagging rather than showing a quiet dash.
            missingHint="Not set — this vendor will not appear under any category filter."
          />
          <Field
            label="Cuisine types"
            value={vendor.cuisineTypes.length > 0 ? vendor.cuisineTypes.join(", ") : null}
            missingHint="Not set — free-text labels the vendor chooses for themselves."
          />
        </div>
      </section>
    </div>
  );
}

/**
 * A file picker that replaces one image.
 *
 * A hidden `<input type="file">` driven by a real button, so the control is
 * keyboard-reachable and looks like the rest of the dashboard rather than like
 * a raw file input.
 *
 * The 8MB ceiling and the accepted types are checked here only to fail fast
 * with a sentence the admin can act on - the backend enforces both properly,
 * and sniffs the real type from the bytes rather than trusting the extension.
 * A phone photo is routinely 3-5MB, so this limit is reached in practice.
 */
function ReplaceImage({
  vendorId,
  type,
  label,
  hasExisting,
}: {
  vendorId: number;
  type: VendorImageType;
  label: string;
  hasExisting: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();

  async function onPick(file: File | undefined) {
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      notify({ ok: false, message: `${label} must be 8MB or smaller. That file is ${(file.size / 1024 / 1024).toFixed(1)}MB.` });
      return;
    }

    const form = new FormData();
    form.append("image", file);

    setBusy(true);
    const result = await uploadVendorImageAction(vendorId, type, form);
    setBusy(false);

    // Clear the input either way, so picking the same file again after a
    // failure still fires a change event.
    if (input.current) input.current.value = "";

    notify(result);
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => onPick(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className="mt-2 flex h-9 items-center justify-center rounded-lg border border-border-subtle px-3 text-xs font-medium text-text-secondary transition duration-150 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Uploading…" : hasExisting ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
      </button>
    </>
  );
}

function Field({
  label,
  value,
  multiline,
  missingHint,
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
  missingHint?: string;
}) {
  return (
    <div className={multiline ? "flex flex-col gap-1" : "flex flex-wrap items-baseline gap-x-4 gap-y-1"}>
      <span className="min-w-40 text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </span>

      {value ? (
        <span className="flex-1 break-words text-sm text-foreground">{value}</span>
      ) : (
        <span className="flex-1 break-words text-sm text-text-muted">
          {missingHint ?? "—"}
        </span>
      )}
    </div>
  );
}
