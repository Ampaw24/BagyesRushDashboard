"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Avatar } from "../../_components/avatar";
import { Badge, RiderPresenceBadge } from "../../_components/status-badge";
import { ImageLightbox } from "../../_components/image-lightbox";
import {
  DetailDialog,
  DetailField,
  DetailSection,
  DialogTabs,
} from "../../_components/detail-dialog";
import { documentsStatusMeta, riderStateMeta } from "../../_lib/status";
import { formatCurrency, formatDate, formatDateTimeOrDash } from "../../_lib/format";
import { StarIcon } from "../../_lib/icons";
import { loadRiderDetailAction } from "../_actions";
import { riderCredentialLabels, riderDocumentLabels } from "@/lib/types/enums";
import type { RiderDetail, RiderRow } from "@/lib/mappers/rider.mapper";

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "vehicle", label: "Vehicle" },
  { key: "compliance", label: "Compliance" },
  { key: "documents", label: "Documents" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/**
 * A rider at a glance, without leaving the list.
 *
 * Reviewing riders is a queue — an admin works down a page of applications
 * deciding who to approve — and a full page navigation per row loses the
 * filters and the scroll position on the way back. Everything needed to make
 * that decision is here: the photo at a size a face is recognisable in, the
 * identity document, the vehicle, what has expired, and the uploaded files.
 *
 * What is deliberately *not* here is the live map, the wallet ledger and the
 * audit trail. Those are investigations rather than glances, they each cost
 * their own request and their own permission, and the full profile is one
 * click away in the footer.
 *
 * The header renders from the row the table already has, so the dialog is
 * never blank; the body fills in when `GET /admin/riders/{id}` answers.
 */
export function ViewRiderDialog({
  rider,
  canViewDocuments,
  onClose,
}: {
  rider: RiderRow;
  /** `riders.documents` — separate from `riders.view`; support does not hold it. */
  canViewDocuments: boolean;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<RiderDetail | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("profile");
  const [preview, setPreview] = useState<{ src: string; label: string } | null>(null);

  useEffect(() => {
    let active = true;

    loadRiderDetailAction(rider.id).then((result) => {
      if (!active) return;
      if (result.ok) setDetail(result.data);
      else setError(result.message);
    });

    return () => {
      active = false;
    };
  }, [rider.id]);

  return (
    <DetailDialog
      label="View rider"
      onClose={onClose}
      header={
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              name={rider.name}
              src={rider.photoUrl}
              className="h-16 w-16 text-lg"
              // The photo is part of what the rider is approved on — it has to
              // be checkable against the Ghana Card, not merely decorative.
              zoomable
              caption={`${rider.name} · ${rider.riderCode}`}
            />
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="break-words text-base font-semibold text-foreground">{rider.name}</h2>
              <span className="break-words text-xs text-text-muted">
                {rider.riderCode}
                {rider.phone ? ` · ${rider.phone}` : ""}
              </span>
              <span className="flex flex-wrap items-center gap-2 pt-0.5">
                <Badge meta={riderStateMeta[rider.derivedState]} />
                <RiderPresenceBadge online={rider.isOnline} />
              </span>
            </div>
          </div>
        </div>
      }
      footer={
        <Link
          href={`/dashboard/riders/${rider.id}`}
          className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
        >
          Open full profile
        </Link>
      }
    >
      {/* The three things that stop a rider working, stated before any tab —
          an admin should not have to go looking for why somebody is grounded. */}
      {detail?.rejectionReason && (
        <Alert tone="critical" title="Reason">
          {detail.rejectionReason}
        </Alert>
      )}

      {detail && detail.credentials.expired.length > 0 && (
        <Alert tone="critical" title="Grounded.">
          {detail.credentials.expired
            .map(
              (entry) =>
                `${riderCredentialLabels[entry.field] ?? entry.field} expired ${formatDate(entry.on)}`,
            )
            .join("; ")}
          . They cannot go online until this is renewed.
        </Alert>
      )}

      {detail && detail.missingProfileFields.length > 0 && (
        <Alert tone="warning" title="Onboarding not finished.">
          Still missing: {detail.missingProfileFields.map(humanise).join(", ")}.
        </Alert>
      )}

      <DialogTabs tabs={TABS} active={tab} onChange={setTab} />

      {error ? (
        <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
          {error}
        </p>
      ) : !detail ? (
        <p className="py-10 text-center text-sm text-text-muted">Loading rider…</p>
      ) : (
        <>
          {tab === "profile" && <ProfileTab rider={detail} />}
          {tab === "vehicle" && <VehicleTab rider={detail} />}
          {tab === "compliance" && <ComplianceTab rider={detail} />}
          {tab === "documents" && (
            <DocumentsTab rider={detail} canView={canViewDocuments} onPreview={setPreview} />
          )}
        </>
      )}

      {preview && (
        <ImageLightbox
          src={preview.src}
          alt={`${rider.name} — ${preview.label}`}
          caption={`${rider.name} · ${preview.label}`}
          onClose={() => setPreview(null)}
        />
      )}
    </DetailDialog>
  );
}

function ProfileTab({ rider }: { rider: RiderDetail }) {
  return (
    <>
      <DetailSection title="Rider">
        <DetailField label="Full name" value={rider.name} />
        <DetailField label="Phone" value={rider.phone ?? "—"} />
        <DetailField label="Email" value={rider.email ?? "—"} />
        <DetailField
          label="Date of birth"
          value={rider.dateOfBirth ? formatDate(rider.dateOfBirth) : "—"}
        />
        <DetailField
          label={rider.identity.typeLabel ?? "Identity document"}
          value={rider.identity.number ?? "—"}
        />
        <DetailField label="City" value={rider.city ?? "—"} />
        <DetailField label="Address" value={rider.residentialAddress ?? "—"} />
        <DetailField
          label="Emergency contact"
          value={
            rider.emergencyContact.name
              ? `${rider.emergencyContact.name}${
                  rider.emergencyContact.relationship
                    ? ` (${rider.emergencyContact.relationship})`
                    : ""
                }${rider.emergencyContact.phone ? ` · ${rider.emergencyContact.phone}` : ""}`
              : "—"
          }
        />
      </DetailSection>

      <DetailSection title="Record" columns={3}>
        <DetailField label="Deliveries" value={rider.deliveriesCompleted.toLocaleString()} />
        <DetailField
          label="Rating"
          value={
            rider.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <StarIcon className="h-3.5 w-3.5 text-status-warning" />
                {rider.rating.toFixed(1)} ({rider.reviewCount})
              </span>
            ) : (
              "No reviews yet"
            )
          }
        />
        <DetailField label="Wallet balance" value={formatCurrency(rider.walletBalance)} />
        <DetailField label="Lifetime earned" value={formatCurrency(rider.lifetimeEarned)} />
        <DetailField label="Joined" value={formatDate(rider.joinedAt)} />
        <DetailField label="Approved" value={formatDateTimeOrDash(rider.approvedAt)} />
      </DetailSection>

      <DetailSection title="Working">
        <DetailField label="Online right now" value={rider.isOnline ? "Yes" : "No"} />
        <DetailField label="Cleared to go online" value={rider.canGoOnline ? "Yes" : "No"} />
        <DetailField label="Last online" value={formatDateTimeOrDash(rider.lastOnlineAt)} />
        {/* Say which figure is the rider's own and which is the platform
            falling back — these columns used to default to 10 and 1, so the
            screen showed a preference nobody had expressed. */}
        <DetailField
          label="Delivery radius"
          value={
            rider.maxDeliveryRadiusKm !== null
              ? `${rider.maxDeliveryRadiusKm} km`
              : `Platform default (${rider.effectiveMaxDeliveryRadiusKm} km)`
          }
        />
        <DetailField
          label="Jobs at once"
          value={
            rider.maxConcurrentJobs !== null
              ? String(rider.maxConcurrentJobs)
              : `Platform default (${rider.effectiveMaxConcurrentJobs})`
          }
        />
        <DetailField
          label="Last known position"
          value={
            rider.currentLatitude !== null && rider.currentLongitude !== null
              ? `${rider.currentLatitude.toFixed(5)}, ${rider.currentLongitude.toFixed(5)}`
              : "Never reported"
          }
        />
      </DetailSection>
    </>
  );
}

function VehicleTab({ rider }: { rider: RiderDetail }) {
  return (
    <>
      <DetailSection title="Vehicle">
        <DetailField label="Type" value={rider.vehicleTypeLabel ?? "—"} />
        <DetailField
          label="Number plate"
          value={rider.plateNumber ?? (rider.requiresPlate ? "Not supplied" : "Not required")}
        />
        <DetailField label="Make" value={rider.vehicle.make ?? "—"} />
        <DetailField label="Model" value={rider.vehicle.model ?? "—"} />
        <DetailField label="Colour" value={rider.vehicle.colour ?? "—"} />
        <DetailField label="Year" value={rider.vehicle.year?.toString() ?? "—"} />
        <DetailField label="Ownership" value={rider.vehicle.ownershipLabel ?? "—"} />
      </DetailSection>

      <DetailSection title="Availability">
        <DetailField
          label="Operating areas"
          value={
            rider.availability.operatingAreas.length > 0
              ? rider.availability.operatingAreas.join(", ")
              : "Not set"
          }
        />
        <DetailField
          label="Days"
          value={
            rider.availability.operatingDays.length > 0
              ? rider.availability.operatingDays.map(titleCase).join(", ")
              : "Not set"
          }
        />
        <DetailField
          label="Hours"
          value={
            rider.availability.shiftStartTime && rider.availability.shiftEndTime
              ? `${rider.availability.shiftStartTime} – ${rider.availability.shiftEndTime}`
              : "Not set"
          }
        />
      </DetailSection>
    </>
  );
}

function ComplianceTab({ rider }: { rider: RiderDetail }) {
  // Whether a date has passed comes from the backend's own list, not a
  // comparison against the browser clock: the backend is what actually refuses
  // to let the rider go online, so a screen deciding it separately could
  // disagree with the rule it is describing.
  const expired = new Set(rider.credentials.expired.map((entry) => entry.field));

  return (
    <>
      <DetailSection title="Driver's licence">
        <DetailField label="Number" value={rider.licence.number ?? "—"} />
        <DetailField label="Class" value={rider.licence.class ?? "—"} />
        <DetailField
          label="Expires"
          value={<Expiry date={rider.licence.expiresAt} expired={expired.has("licence_expires_at")} />}
        />
        <DetailField label="Permit number" value={rider.licence.permitNumber ?? "—"} />
        <DetailField
          label="Permit expires"
          value={
            <Expiry
              date={rider.licence.permitExpiresAt}
              expired={expired.has("permit_expires_at")}
            />
          }
        />
      </DetailSection>

      <DetailSection title="Insurance">
        <DetailField label="Provider" value={rider.insurance.provider ?? "—"} />
        <DetailField label="Policy number" value={rider.insurance.policyNumber ?? "—"} />
        <DetailField
          label="Expires"
          value={
            <Expiry
              date={rider.insurance.expiresAt}
              expired={expired.has("insurance_expires_at")}
            />
          }
        />
        <DetailField
          label="Roadworthy expires"
          value={
            <Expiry
              date={rider.insurance.roadworthyExpiresAt}
              expired={expired.has("roadworthy_expires_at")}
            />
          }
        />
      </DetailSection>

      <DetailSection title="Consent">
        <DetailField
          label="Rider agreement"
          value={
            rider.consent.termsAcceptedAt
              ? `Accepted ${formatDate(rider.consent.termsAcceptedAt)}`
              : "Not accepted"
          }
        />
        <DetailField label="Version agreed" value={rider.consent.termsVersion ?? "—"} />
        <DetailField label="Version in force" value={rider.consent.currentTermsVersion ?? "—"} />
        <DetailField
          label="Verification consent"
          value={
            rider.consent.dataConsentAt
              ? `Given ${formatDate(rider.consent.dataConsentAt)}`
              : "Not given"
          }
        />
      </DetailSection>

      {rider.consent.isOutdated && (
        <Alert tone="warning" title="Old terms.">
          They agreed to an earlier version of the rider agreement and need to accept the current
          one.
        </Alert>
      )}

      {rider.credentials.expiringSoon.length > 0 && (
        <Alert tone="warning" title="Renewals due.">
          {rider.credentials.expiringSoon
            .map(
              (entry) =>
                `${riderCredentialLabels[entry.field] ?? entry.field} on ${formatDate(entry.on)}`,
            )
            .join("; ")}
          .
        </Alert>
      )}
    </>
  );
}

function DocumentsTab({
  rider,
  canView,
  onPreview,
}: {
  rider: RiderDetail;
  canView: boolean;
  onPreview: (preview: { src: string; label: string }) => void;
}) {
  // Only what this rider actually has to supply. A bicycle courier has no
  // licence, insurance or roadworthy certificate, so listing them as "missing"
  // would read as an application that can never complete.
  const required = rider.documents.filter((document) => document.required);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {rider.documentsStatus && documentsStatusMeta[rider.documentsStatus] && (
          <Badge meta={documentsStatusMeta[rider.documentsStatus]} />
        )}
        <span className="text-sm text-text-muted">
          Reviewed {formatDateTimeOrDash(rider.documentsReviewedAt)}
        </span>
      </div>

      {required.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-muted">
          This vehicle needs no paperwork on file.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border-subtle rounded-xl border border-border-subtle">
          {required.map((document) => (
            <li
              key={document.type}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <span className="min-w-0">
                <span className="block break-words text-sm font-medium text-foreground">
                  {riderDocumentLabels[document.type]}
                </span>
                <span className="block text-xs text-text-muted">
                  {document.uploaded ? "Uploaded" : "Not uploaded"}
                </span>
              </span>

              {document.uploaded && canView ? (
                <button
                  type="button"
                  onClick={() =>
                    onPreview({
                      // Through the proxy route: the file is on the private disk
                      // behind a bearer token the browser cannot supply.
                      src: `/api/rider-document?riderId=${rider.id}&type=${document.type}`,
                      label: riderDocumentLabels[document.type],
                    })
                  }
                  className="flex h-9 items-center rounded-lg border border-border-subtle px-3.5 text-sm font-medium text-brand transition duration-150 hover:bg-surface-muted"
                >
                  View
                </button>
              ) : (
                <span className="text-xs text-text-muted">
                  {document.uploaded ? "Permission required" : "—"}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Expiry({ date, expired = false }: { date: Date | null; expired?: boolean }) {
  if (!date) return <span className="text-text-muted">Not set</span>;

  return (
    <span className={expired ? "text-status-critical" : undefined}>
      {formatDate(date)}
      {expired ? " · expired" : ""}
    </span>
  );
}

function Alert({
  tone,
  title,
  children,
}: {
  tone: "critical" | "warning";
  title: string;
  children: React.ReactNode;
}) {
  const classes =
    tone === "critical"
      ? "border-status-critical/30 bg-status-critical/5"
      : "border-status-warning/30 bg-status-warning/5";

  return (
    <p className={`break-words rounded-xl border px-4 py-3 text-sm ${classes}`}>
      <span className="font-medium text-foreground">{title} </span>
      <span className="text-text-secondary">{children}</span>
    </p>
  );
}

/** `missing_profile_fields` arrives as raw column names. */
function humanise(field: string): string {
  return field.replace(/_/g, " ");
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
