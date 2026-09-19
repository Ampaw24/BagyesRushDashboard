"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Avatar } from "../../_components/avatar";
import { Badge } from "../../_components/status-badge";
import { ImageLightbox } from "../../_components/image-lightbox";
import {
  DetailDialog,
  DetailField,
  DetailSection,
  DialogTabs,
} from "../../_components/detail-dialog";
import { documentsStatusMeta, vendorStateMeta } from "../../_lib/status";
import { formatCurrency, formatDate, formatDateTimeOrDash } from "../../_lib/format";
import { StarIcon } from "../../_lib/icons";
import { loadVendorDetailAction } from "../_actions";
import { vendorDocumentLabels } from "@/lib/types/enums";
import type { VendorDetail, VendorRow } from "@/lib/mappers/vendor.mapper";

const TABS = [
  { key: "business", label: "Business" },
  { key: "trading", label: "Trading" },
  { key: "branding", label: "Branding" },
  { key: "documents", label: "Documents" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/**
 * A vendor at a glance, without leaving the list.
 *
 * The same reasoning as the rider dialog: approving kitchens is a queue, and a
 * page navigation per row costs the filters and the scroll position. The
 * branding tab is the vendor equivalent of a rider's photo — the logo and the
 * storefront shot are what a customer sees, so they are part of what an admin
 * approves, and they have never been viewable at a usable size from the list.
 *
 * The menu, the wallet ledger and the audit trail stay on the full profile:
 * each is its own request and its own permission, and none of them is a glance.
 */
export function ViewVendorDialog({
  vendor,
  canViewDocuments,
  onClose,
}: {
  vendor: VendorRow;
  /** `vendors.documents` — reading who they are, separate from managing them. */
  canViewDocuments: boolean;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<VendorDetail | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("business");
  const [preview, setPreview] = useState<{ src: string; label: string } | null>(null);

  useEffect(() => {
    let active = true;

    loadVendorDetailAction(vendor.id).then((result) => {
      if (!active) return;
      if (result.ok) setDetail(result.data);
      else setError(result.message);
    });

    return () => {
      active = false;
    };
  }, [vendor.id]);

  return (
    <DetailDialog
      label="View vendor"
      onClose={onClose}
      header={
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            name={vendor.businessName}
            src={vendor.logoUrl}
            className="h-16 w-16 rounded-xl text-lg"
            zoomable
            caption={`${vendor.businessName} · ${vendor.vendorId}`}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="break-words text-base font-semibold text-foreground">
              {vendor.businessName}
            </h2>
            <span className="break-words text-xs text-text-muted">
              {vendor.vendorId}
              {vendor.phone ? ` · ${vendor.phone}` : ""}
            </span>
            <span className="flex flex-wrap items-center gap-2 pt-0.5">
              <Badge meta={vendorStateMeta[vendor.derivedState]} />
              {vendor.isFeatured && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
                  <StarIcon className="h-3 w-3" />
                  Featured
                </span>
              )}
            </span>
          </div>
        </div>
      }
      footer={
        <Link
          href={`/dashboard/vendors/${vendor.id}`}
          className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
        >
          Open full profile
        </Link>
      }
    >
      {detail?.rejectionReason && (
        <p className="break-words rounded-xl border border-status-critical/30 bg-status-critical/5 px-4 py-3 text-sm">
          <span className="font-medium text-foreground">Rejection reason: </span>
          <span className="text-text-secondary">{detail.rejectionReason}</span>
        </p>
      )}

      {detail && detail.missingProfileFields.length > 0 && (
        <p className="break-words rounded-xl border border-status-warning/30 bg-status-warning/5 px-4 py-3 text-sm">
          <span className="font-medium text-foreground">Profile not finished. </span>
          <span className="text-text-secondary">
            Still missing: {detail.missingProfileFields.map(humanise).join(", ")}.
          </span>
        </p>
      )}

      <DialogTabs tabs={TABS} active={tab} onChange={setTab} />

      {error ? (
        <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
          {error}
        </p>
      ) : !detail ? (
        <p className="py-10 text-center text-sm text-text-muted">Loading vendor…</p>
      ) : (
        <>
          {tab === "business" && <BusinessTab vendor={detail} />}
          {tab === "trading" && <TradingTab vendor={detail} />}
          {tab === "branding" && <BrandingTab vendor={detail} onPreview={setPreview} />}
          {tab === "documents" && <DocumentsTab vendor={detail} canView={canViewDocuments} />}
        </>
      )}

      {preview && (
        <ImageLightbox
          src={preview.src}
          alt={`${vendor.businessName} — ${preview.label}`}
          caption={`${vendor.businessName} · ${preview.label}`}
          onClose={() => setPreview(null)}
        />
      )}
    </DetailDialog>
  );
}

function BusinessTab({ vendor }: { vendor: VendorDetail }) {
  return (
    <>
      <DetailSection title="Business">
        <DetailField label="Business name" value={vendor.businessName} />
        <DetailField label="Type" value={vendor.businessType ?? "—"} />
        <DetailField label="Contact person" value={vendor.contactPersonName} />
        <DetailField label="Phone" value={vendor.phone ?? "—"} />
        <DetailField label="Email" value={vendor.email ?? "—"} />
        <DetailField label="City" value={vendor.city} />
        <DetailField label="Address" value={vendor.businessAddress} />
        <DetailField label="Tax ID" value={vendor.taxIdentificationNumber ?? "—"} />
      </DetailSection>

      <DetailSection title="Record" columns={3}>
        <DetailField
          label="Rating"
          value={
            vendor.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <StarIcon className="h-3.5 w-3.5 text-status-warning" />
                {vendor.rating.toFixed(1)} ({vendor.reviewCount})
              </span>
            ) : (
              "No reviews yet"
            )
          }
        />
        <DetailField label="Joined" value={formatDate(vendor.joinedAt)} />
        <DetailField label="Profile complete" value={vendor.isProfileComplete ? "Yes" : "No"} />
        <DetailField
          label="Payout destination"
          value={vendor.payoutConfigured ? "On file" : "Not set — they cannot be paid"}
        />
        <DetailField
          label="Position"
          value={
            vendor.latitude !== null && vendor.longitude !== null
              ? `${vendor.latitude.toFixed(5)}, ${vendor.longitude.toFixed(5)}`
              : "Not set"
          }
        />
        <DetailField label="Last updated" value={formatDateTimeOrDash(vendor.updatedAt)} />
      </DetailSection>
    </>
  );
}

function TradingTab({ vendor }: { vendor: VendorDetail }) {
  return (
    <>
      <DetailSection title="Open for business">
        {/* Two rows, because they answer different questions: a vendor who has
            switched themselves off is a different problem from one simply
            outside their hours. */}
        <DetailField label="Vendor switch" value={vendor.isOpen ? "On" : "Off"} />
        <DetailField label="Open right now" value={openNowLabel(vendor)} />
        <DetailField label="Accepting orders" value={vendor.isActive ? "Yes" : "No"} />
        <DetailField
          label="Hours"
          value={
            vendor.openingTime && vendor.closingTime
              ? `${vendor.openingTime} – ${vendor.closingTime}`
              : "Not set"
          }
        />
        <DetailField
          label="Operating days"
          value={vendor.operatingDays.length > 0 ? vendor.operatingDays.join(", ") : "Not set"}
        />
        <DetailField
          label="Prep time"
          value={vendor.estimatedPrepTimeMinutes ? `${vendor.estimatedPrepTimeMinutes} min` : "—"}
        />
      </DetailSection>

      <DetailSection title="Delivery and pricing">
        <DetailField label="Vendor delivery fee" value={formatCurrency(vendor.deliveryFee)} />
        <DetailField label="Minimum order" value={formatCurrency(vendor.minOrder)} />
        <DetailField
          label="Delivery time shown"
          value={`${vendor.deliveryTimeMin}–${vendor.deliveryTimeMax} min`}
        />
        <DetailField
          label="Delivery radius"
          value={vendor.deliveryRadiusKm !== null ? `${vendor.deliveryRadiusKm} km` : "Not set"}
        />
      </DetailSection>
    </>
  );
}

/**
 * What a customer sees of them.
 *
 * These are approved alongside the paperwork — a storefront photo of the wrong
 * building, or a logo that is a screenshot of somebody else's, is a reason to
 * refuse — and until now they could only be judged from a 32px circle.
 */
function BrandingTab({
  vendor,
  onPreview,
}: {
  vendor: VendorDetail;
  onPreview: (preview: { src: string; label: string }) => void;
}) {
  const images = [
    { src: vendor.logoUrl, label: "Logo" },
    { src: vendor.imageUrl, label: "Storefront" },
    { src: vendor.coverImageUrl, label: "Cover" },
  ].filter((image): image is { src: string; label: string } => Boolean(image.src));

  return (
    <div className="flex flex-col gap-4">
      {images.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-muted">
          No logo, storefront photo or cover image uploaded.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <button
              key={image.label}
              type="button"
              onClick={() => onPreview(image)}
              className="group flex flex-col gap-2 rounded-xl border border-border-subtle p-2 text-left transition duration-150 hover:border-brand/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt={`${vendor.businessName} ${image.label.toLowerCase()}`}
                className="h-28 w-full rounded-lg object-cover"
              />
              <span className="text-xs font-medium text-text-secondary group-hover:text-foreground">
                {image.label}
              </span>
            </button>
          ))}
        </div>
      )}

      <DetailSection title="Listing" columns={1}>
        <DetailField label="Description" value={vendor.description ?? "—"} />
        <DetailField
          label="Categories"
          value={vendor.categories.length > 0 ? vendor.categories.join(", ") : "None"}
        />
        <DetailField
          label="Cuisine types"
          value={vendor.cuisineTypes.length > 0 ? vendor.cuisineTypes.join(", ") : "None"}
        />
        <DetailField label="Promo text" value={vendor.promoText ?? "—"} />
      </DetailSection>
    </div>
  );
}

function DocumentsTab({ vendor, canView }: { vendor: VendorDetail; canView: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {vendor.documentsStatus && documentsStatusMeta[vendor.documentsStatus] && (
          <Badge meta={documentsStatusMeta[vendor.documentsStatus]} />
        )}
        <span className="text-sm text-text-muted">
          Reviewed {formatDateTimeOrDash(vendor.documentsReviewedAt)}
        </span>
      </div>

      <ul className="flex flex-col divide-y divide-border-subtle rounded-xl border border-border-subtle">
        {vendor.documents.map((document) => (
          <li
            key={document.type}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <span className="min-w-0">
              <span className="block break-words text-sm font-medium text-foreground">
                {vendorDocumentLabels[document.type]}
              </span>
              <span className="block text-xs text-text-muted">
                {document.uploaded ? "Uploaded" : "Not uploaded"}
              </span>
            </span>

            {document.uploaded && canView ? (
              // The endpoint streams a binary file from the private disk, so
              // this is a link out rather than something fetched as JSON. A
              // vendor document is as often a PDF as an image, which is why
              // this is not the inline viewer the rider photos use.
              <a
                href={`/api/vendor-document?vendorId=${vendor.id}&type=${document.type}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 items-center rounded-lg border border-border-subtle px-3.5 text-sm font-medium text-brand transition duration-150 hover:bg-surface-muted"
              >
                Open
              </a>
            ) : (
              <span className="text-xs text-text-muted">
                {document.uploaded ? "Permission required" : "—"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function openNowLabel(vendor: VendorDetail): string {
  if (vendor.isOpenNow) return "Yes";

  switch (vendor.closedReason) {
    case "switched_off":
      return "No — switched off by the vendor";
    case "closed_today":
      return "No — not a trading day";
    case "outside_hours":
      return "No — outside their hours";
    default:
      return "No";
  }
}

/** `missing_profile_fields` arrives as raw column names. */
function humanise(field: string): string {
  return field.replace(/_/g, " ");
}
