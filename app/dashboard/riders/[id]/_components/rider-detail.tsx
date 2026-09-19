"use client";

import { useState } from "react";

import { Badge, RiderPresenceBadge } from "../../../_components/status-badge";
import { Tabs } from "../../../_components/tabs";
import { TableCell, TableHeadCell, TableShell } from "../../../_components/table-shell";
import { ActionMenu } from "../../../_components/action-menu";
import { EmptyState } from "../../../_components/empty-state";
import { PageHeader } from "../../../_components/page-header";
import { documentsStatusMeta, riderStateMeta } from "../../../_lib/status";
import { formatDate, formatDateTimeOrDash } from "../../../_lib/format";
import { EditIcon, StarIcon } from "../../../_lib/icons";
import { useRiderStatusActions } from "../../../_hooks/use-rider-status-actions";
import { useSendMessage } from "../../../_hooks/use-send-message";
import { EditRiderDialog } from "./edit-rider-dialog";
import { RiderLocationMap } from "./rider-location-map";
import { Avatar } from "../../../_components/avatar";
import { ImageLightbox } from "../../../_components/image-lightbox";
import type { RiderDetail as RiderDetailModel, RiderPayout } from "@/lib/mappers/rider.mapper";
import type { ActivityRow } from "@/lib/mappers/activity.mapper";
import type { WalletSummary, WalletTransactionRow } from "@/lib/mappers/wallet.mapper";
import { WalletTab } from "../../../_components/wallet-tab";
import { riderCredentialLabels, riderDocumentLabels } from "@/lib/types/enums";
import type { VehicleCatalogue } from "../../_components/vehicle-picker";

export type RiderDetailProps = {
  rider: RiderDetailModel;
  /** The type -> make -> model tree, so the edit dialog's picker cascades. */
  catalogue: VehicleCatalogue;
  /** Present only when the admin holds `riders.payout`; every read is audit-logged. */
  payout: RiderPayout | null;
  /** From GET /admin/activity filtered to this rider; empty without `audit.view`. */
  activity: ActivityRow[];
  /** Present only when the admin holds `riders.wallet`. */
  wallet: WalletSummary | null;
  transactions: WalletTransactionRow[];
  permissions: {
    canModerate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canViewDocuments: boolean;
    canAdjustWallet: boolean;
    /** `communications.send` — sending SMS spends credits, so it is its own right. */
    canMessage: boolean;
  };
};

const TABS = [
  { key: "overview", label: "Overview" },
  // Second, not buried at the bottom: when somebody opens a rider's profile
  // during a delivery, where they are is usually the question.
  { key: "map", label: "Map" },
  { key: "compliance", label: "Compliance" },
  { key: "documents", label: "Documents" },
  { key: "wallet", label: "Wallet" },
  { key: "payout", label: "Payout" },
  { key: "activity", label: "Activity" },
];

export function RiderDetail({
  rider,
  catalogue,
  payout,
  activity,
  wallet,
  transactions,
  permissions,
}: RiderDetailProps) {
  const [tab, setTab] = useState("overview");
  const { actions, dialog } = useRiderStatusActions(rider, permissions);
  const { actions: messageActions, dialog: messageDialog } = useSendMessage(
    { userId: rider.userId, name: rider.name, phone: rider.phone },
    permissions.canMessage,
  );
  const [editing, setEditing] = useState(false);

  const headerActions = [
    // riders.update: correcting a plate or a city, not deciding whether they
    // may work. The same permission the availability switch carries.
    ...(permissions.canUpdate
      ? [{ label: "Edit details", icon: EditIcon, onClick: () => setEditing(true) }]
      : []),
    ...messageActions,
    ...actions,
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {/* The photo a customer sees at the door, at a size somebody can
                actually recognise a face in. It was already on every list row
                and nowhere on the profile. */}
            <Avatar
              name={rider.name}
              src={rider.photoUrl}
              className="h-12 w-12 text-sm"
              // The photo is part of what an admin approves them on — it has
              // to be checkable against the Ghana Card, not just decorative.
              zoomable
              caption={`${rider.name} · ${rider.riderCode}`}
            />
            {rider.name}
            <Badge meta={riderStateMeta[rider.derivedState]} />
            <RiderPresenceBadge online={rider.isOnline} />
          </span>
        }
        description={`${rider.riderCode} · joined ${formatDate(rider.joinedAt)}`}
        action={headerActions.length > 0 ? <ActionMenu items={headerActions} /> : undefined}
      />

      {rider.rejectionReason && (
        <p className="break-words rounded-xl border border-status-critical/30 bg-status-critical/5 px-4 py-3 text-sm">
          <span className="font-medium text-foreground">Reason: </span>
          <span className="text-text-secondary">{rider.rejectionReason}</span>
        </p>
      )}

      {rider.credentials.expired.length > 0 && (
        <p className="break-words rounded-xl border border-status-critical/30 bg-status-critical/5 px-4 py-3 text-sm">
          <span className="font-medium text-foreground">Grounded. </span>
          <span className="text-text-secondary">
            {rider.credentials.expired
              .map((entry) => `${riderCredentialLabels[entry.field] ?? entry.field} expired ${formatDate(entry.on)}`)
              .join("; ")}
            . They cannot go online until this is renewed.
          </span>
        </p>
      )}

      {rider.missingProfileFields.length > 0 && (
        <p className="break-words rounded-xl border border-status-warning/30 bg-status-warning/5 px-4 py-3 text-sm">
          <span className="font-medium text-foreground">Onboarding not finished. </span>
          <span className="text-text-secondary">
            Still missing: {rider.missingProfileFields.map(humanise).join(", ")}.
          </span>
        </p>
      )}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "overview" && <OverviewTab rider={rider} />}
      {tab === "map" && <RiderLocationMap rider={rider} />}
      {tab === "compliance" && <ComplianceTab rider={rider} />}
      {tab === "documents" && (
        <DocumentsTab rider={rider} canView={permissions.canViewDocuments} />
      )}
      {tab === "wallet" && (
        <WalletTab
          party="rider"
          ownerId={rider.id}
          ownerName={rider.name}
          summary={wallet}
          transactions={transactions}
          canAdjust={permissions.canAdjustWallet}
        />
      )}
      {tab === "payout" && <PayoutTab rider={rider} payout={payout} />}
      {tab === "activity" && <ActivityTab activity={activity} />}

      {dialog}
      {messageDialog}
      {editing && (
        <EditRiderDialog rider={rider} catalogue={catalogue} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}

function OverviewTab({ rider }: { rider: RiderDetailModel }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Rider">
        <Row label="Full name" value={rider.name} />
        <Row label="Phone" value={rider.phone ?? "—"} />
        <Row label="Email" value={rider.email ?? "—"} />
        <Row label="Date of birth" value={rider.dateOfBirth ? formatDate(rider.dateOfBirth) : "—"} />
        <Row label={rider.identity.typeLabel ?? "Identity document"} value={rider.identity.number ?? "—"} />
        <Row label="Address" value={rider.residentialAddress ?? "—"} />
        <Row label="City" value={rider.city ?? "—"} />
      </Card>

      <Card title="Vehicle">
        <Row label="Type" value={rider.vehicleTypeLabel ?? "—"} />
        <Row label="Number plate" value={rider.plateNumber ?? "—"} />
        <Row label="Make" value={rider.vehicle.make ?? "—"} />
        <Row label="Model" value={rider.vehicle.model ?? "—"} />
        <Row label="Colour" value={rider.vehicle.colour ?? "—"} />
        <Row label="Year" value={rider.vehicle.year?.toString() ?? "—"} />
        <Row label="Ownership" value={rider.vehicle.ownershipLabel ?? "—"} />
      </Card>

      <Card title="Working">
        <Row label="Online right now" value={rider.isOnline ? "Yes" : "No"} />
        <Row label="Cleared to go online" value={rider.canGoOnline ? "Yes" : "No"} />
        <Row label="Last online" value={formatDateTimeOrDash(rider.lastOnlineAt)} />
        {/* Say which figure is the rider's own and which is the platform
            falling back. These columns used to default to 10 and 1, so this
            screen showed a preference nobody had expressed. */}
        <Row
          label="Delivery radius"
          value={
            rider.maxDeliveryRadiusKm !== null
              ? `${rider.maxDeliveryRadiusKm} km`
              : `Not set — platform default (${rider.effectiveMaxDeliveryRadiusKm} km)`
          }
        />
        <Row
          label="Jobs at once"
          value={
            rider.maxConcurrentJobs !== null
              ? String(rider.maxConcurrentJobs)
              : `Not set — platform default (${rider.effectiveMaxConcurrentJobs})`
          }
        />
        <Row
          label="Last known position"
          value={
            rider.currentLatitude !== null && rider.currentLongitude !== null
              ? `${rider.currentLatitude.toFixed(5)}, ${rider.currentLongitude.toFixed(5)} · ${formatDateTimeOrDash(rider.locationUpdatedAt)}`
              : "Never reported"
          }
        />
        <Row label="Photo" value={rider.photoUrl ? "Uploaded" : "Not uploaded"} />
      </Card>

      <Card title="Record">
        <Row label="Deliveries completed" value={rider.deliveriesCompleted.toLocaleString()} />
        <Row
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
        <Row label="Approved" value={formatDateTimeOrDash(rider.approvedAt)} />
        <Row
          label="Emergency contact"
          value={
            rider.emergencyContact.name
              ? `${rider.emergencyContact.name}${rider.emergencyContact.relationship ? ` (${rider.emergencyContact.relationship})` : ""}`
              : "—"
          }
        />
        <Row label="Emergency phone" value={rider.emergencyContact.phone ?? "—"} />
      </Card>
    </div>
  );
}

/**
 * The paperwork that has to be current, not merely photographed.
 *
 * A licence scan proves a licence existed on the day it was taken. This tab is
 * about whether it is still valid today, which is the only version of the
 * question that matters when somebody is about to go out on the road.
 */
function ComplianceTab({ rider }: { rider: RiderDetailModel }) {
  // The columns the backend has already judged expired.
  const expired = new Set(rider.credentials.expired.map((entry) => entry.field));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Driver's licence">
        <Row label="Number" value={rider.licence.number ?? "—"} />
        <Row label="Class" value={rider.licence.class ?? "—"} />
        <Row
          label="Expires"
          value={
            <ExpiryValue
              date={rider.licence.expiresAt}
              expired={expired.has("licence_expires_at")}
            />
          }
        />
        <Row label="Permit number" value={rider.licence.permitNumber ?? "—"} />
        <Row
          label="Permit expires"
          value={
            <ExpiryValue
              date={rider.licence.permitExpiresAt}
              expired={expired.has("permit_expires_at")}
            />
          }
        />
      </Card>

      <Card title="Insurance">
        <Row label="Provider" value={rider.insurance.provider ?? "—"} />
        <Row label="Policy number" value={rider.insurance.policyNumber ?? "—"} />
        <Row
          label="Expires"
          value={
            <ExpiryValue
              date={rider.insurance.expiresAt}
              expired={expired.has("insurance_expires_at")}
            />
          }
        />
        <Row
          label="Roadworthy expires"
          value={
            <ExpiryValue
              date={rider.insurance.roadworthyExpiresAt}
              expired={expired.has("roadworthy_expires_at")}
            />
          }
        />
      </Card>

      <Card title="Consent">
        <Row
          label="Rider agreement"
          value={
            rider.consent.termsAcceptedAt
              ? `Accepted ${formatDate(rider.consent.termsAcceptedAt)}`
              : "Not accepted"
          }
        />
        <Row label="Version agreed" value={rider.consent.termsVersion ?? "—"} />
        <Row label="Version in force" value={rider.consent.currentTermsVersion ?? "—"} />
        <Row
          label="Verification consent"
          value={
            rider.consent.dataConsentAt
              ? `Given ${formatDate(rider.consent.dataConsentAt)}`
              : "Not given"
          }
        />
        {rider.consent.isOutdated && (
          <p className="text-sm text-status-warning">
            They agreed to an older version of the terms and need to accept the current one.
          </p>
        )}
      </Card>

      <Card title="Availability">
        <Row
          label="Operating areas"
          value={
            rider.availability.operatingAreas.length > 0
              ? rider.availability.operatingAreas.join(", ")
              : "Not set"
          }
        />
        <Row
          label="Days"
          value={
            rider.availability.operatingDays.length > 0
              ? rider.availability.operatingDays.map(titleCase).join(", ")
              : "Not set"
          }
        />
        <Row
          label="Hours"
          value={
            rider.availability.shiftStartTime && rider.availability.shiftEndTime
              ? `${rider.availability.shiftStartTime} – ${rider.availability.shiftEndTime}`
              : "Not set"
          }
        />
        <Row
          label="Delivery radius"
          value={
            rider.maxDeliveryRadiusKm !== null
              ? `${rider.maxDeliveryRadiusKm} km`
              : `Not set — platform default (${rider.effectiveMaxDeliveryRadiusKm} km)`
          }
        />
      </Card>

      {rider.credentials.expiringSoon.length > 0 && (
        <div className="lg:col-span-2">
          <p className="break-words rounded-xl border border-status-warning/30 bg-status-warning/5 px-4 py-3 text-sm">
            <span className="font-medium text-foreground">Renewals due. </span>
            <span className="text-text-secondary">
              {rider.credentials.expiringSoon
                .map(
                  (entry) =>
                    `${riderCredentialLabels[entry.field] ?? entry.field} on ${formatDate(entry.on)}`,
                )
                .join("; ")}
              .
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * A date, plus whether it has already passed.
 *
 * `expired` comes from the backend's own `credentials.expired` list rather than
 * a comparison against the browser clock: the backend is what actually refuses
 * to let the rider go online, so a screen deciding it separately could disagree
 * with the rule it is describing.
 */
function ExpiryValue({ date, expired = false }: { date: Date | null; expired?: boolean }) {
  if (!date) return <span className="text-text-muted">Not set</span>;

  return (
    <span className={expired ? "text-status-critical" : undefined}>
      {formatDate(date)}
      {expired ? " · expired" : ""}
    </span>
  );
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function DocumentsTab({ rider, canView }: { rider: RiderDetailModel; canView: boolean }) {
  // Only the documents this rider actually has to supply. A bicycle courier has
  // no licence, insurance or roadworthy certificate, so listing them as
  // "missing" would read as an incomplete application that can never complete.
  const required = rider.documents.filter((document) => document.required);

  const [preview, setPreview] = useState<{ src: string; label: string } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {rider.documentsStatus && documentsStatusMeta[rider.documentsStatus] && (
          <Badge meta={documentsStatusMeta[rider.documentsStatus]} />
        )}
        <span className="text-sm text-text-muted">
          Reviewed {formatDateTimeOrDash(rider.documentsReviewedAt)}
        </span>
      </div>

      <TableShell>
        <thead>
          <tr>
            <TableHeadCell>Document</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>
              <span className="sr-only">Open</span>
            </TableHeadCell>
          </tr>
        </thead>
        <tbody>
          {required.map((document) => (
            <tr key={document.type}>
              <TableCell className="font-medium">{riderDocumentLabels[document.type]}</TableCell>
              <TableCell className="text-text-secondary">
                {document.uploaded ? "Uploaded" : "Not uploaded"}
              </TableCell>
              <TableCell>
                {document.uploaded && canView ? (
                  <span className="flex items-center gap-3">
                    {/* Inline first: reviewing a rider means flipping through
                        five documents, and a new tab for each of them is five
                        tabs to close before the next applicant. */}
                    <button
                      type="button"
                      onClick={() =>
                        setPreview({
                          src: `/api/rider-document?riderId=${rider.id}&type=${document.type}`,
                          label: riderDocumentLabels[document.type],
                        })
                      }
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      View
                    </button>
                    <a
                      // Through the proxy route: the file lives on the private
                      // disk behind a bearer token the browser cannot supply.
                      href={`/api/rider-document?riderId=${rider.id}&type=${document.type}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-text-secondary hover:underline"
                    >
                      Open
                    </a>
                  </span>
                ) : (
                  <span className="text-sm text-text-muted">
                    {document.uploaded ? "Permission required" : "—"}
                  </span>
                )}
              </TableCell>
            </tr>
          ))}
        </tbody>
      </TableShell>

      {preview && (
        <ImageLightbox
          src={preview.src}
          alt={`${rider.name} — ${preview.label}`}
          caption={`${rider.name} · ${preview.label}`}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

function PayoutTab({ rider, payout }: { rider: RiderDetailModel; payout: RiderPayout | null }) {
  if (!payout) {
    return (
      <EmptyState
        title="Payout details are not visible to your role"
        description="Reading where a rider's money goes needs the riders.payout permission, which is separate from managing them."
      />
    );
  }

  if (!payout.isConfigured) {
    return (
      <EmptyState
        title="No payout destination on file"
        description={`${rider.name} has not given a bank account or a mobile money number yet, so they cannot be paid.`}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Bank account">
        <Row label="Bank" value={payout.bankName ?? "—"} />
        <Row label="Account name" value={payout.accountName ?? "—"} />
        <Row
          label="Account number"
          value={payout.accountNumberLast4 ? `•••• ${payout.accountNumberLast4}` : "—"}
        />
      </Card>

      <Card title="Mobile money">
        <Row label="Network" value={payout.momoProviderName ?? "—"} />
        <Row
          label="Number"
          value={
            payout.mobileMoneyNumberLast4 ? `•••• ${payout.mobileMoneyNumberLast4}` : "—"
          }
        />
      </Card>

      <p className="text-sm text-text-muted lg:col-span-2">
        Full account numbers are encrypted at rest and are never returned by the API. Every read of
        this tab is recorded in the audit log.
      </p>
    </div>
  );
}

function ActivityTab({ activity }: { activity: ActivityRow[] }) {
  if (activity.length === 0) {
    return (
      <EmptyState
        title="No recorded activity"
        description="Administrator actions against this rider will appear here."
      />
    );
  }

  return (
    <TableShell>
      <thead>
        <tr>
          <TableHeadCell>Action</TableHeadCell>
          <TableHeadCell>Description</TableHeadCell>
          <TableHeadCell>Administrator</TableHeadCell>
          <TableHeadCell>When</TableHeadCell>
        </tr>
      </thead>
      <tbody>
        {activity.map((entry) => (
          <tr key={entry.id}>
            <TableCell className="font-medium">{entry.actionLabel}</TableCell>
            <TableCell className="text-text-secondary">{entry.description}</TableCell>
            <TableCell className="text-text-secondary">{entry.adminEmail}</TableCell>
            <TableCell className="text-text-secondary">
              {formatDateTimeOrDash(entry.createdAt)}
            </TableCell>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

/** `missing_profile_fields` arrives as raw column names. */
function humanise(field: string): string {
  return field.replace(/_/g, " ");
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <h3 className="break-words text-sm font-semibold text-foreground">{title}</h3>
      <dl className="flex flex-col gap-2">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
      <dt className="text-text-muted">{label}</dt>
      <dd className="break-words text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
