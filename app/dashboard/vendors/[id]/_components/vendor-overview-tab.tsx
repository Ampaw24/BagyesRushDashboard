import { formatCurrency, formatDateTime } from "../../../_lib/format";
import type { Vendor } from "../../../_services/vendors-mock-data";

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">{children}</dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-text-muted">{label}</dt>
      <dd className="break-words font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function VendorOverviewTab({ vendor, ownerEmail }: { vendor: Vendor; ownerEmail?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <InfoCard title="Business information">
        <Field label="Registration name" value={vendor.registrationName} />
        <Field label="Category" value={vendor.category} />
        <Field label="Phone" value={vendor.phone} />
        <Field label="Email" value={vendor.email} />
        {vendor.website && <Field label="Website" value={vendor.website} />}
        <Field label="Description" value={vendor.description} />
      </InfoCard>

      <InfoCard title="Owner">
        <Field label="Name" value={vendor.ownerName} />
        <Field label="Owner account" value={`${vendor.ownerUserId}${ownerEmail ? ` · ${ownerEmail}` : ""}`} />
        <Field label="Phone" value={vendor.ownerPhone} />
        <Field label="Email" value={vendor.ownerEmail} />
      </InfoCard>

      <InfoCard title="Location">
        <Field label="Address" value={vendor.address} />
        <Field label="City" value={vendor.city} />
        <Field label="Region" value={vendor.region} />
        <Field label="Delivery area" value={`${vendor.deliveryAreaKm} km radius`} />
      </InfoCard>

      <InfoCard title="Operating information">
        <Field label="Hours" value={`${vendor.openingTime} – ${vendor.closingTime}`} />
        <Field label="Operating days" value={vendor.operatingDays.join(", ") || "None set"} />
        <Field label="Minimum order" value={formatCurrency(vendor.minimumOrderAmount)} />
        <Field label="Estimated prep time" value={`${vendor.estimatedPrepMinutes} min`} />
        <Field label="Delivery" value={vendor.deliveryAvailable ? "Available" : "Unavailable"} />
        <Field label="Pickup" value={vendor.pickupAvailable ? "Available" : "Unavailable"} />
      </InfoCard>

      <div className="flex flex-col gap-1 rounded-xl border border-border-subtle bg-surface-muted p-4 text-xs text-text-muted">
        <span>
          Last updated by <span className="font-medium text-text-secondary">{vendor.updatedBy}</span>
        </span>
        <span>{formatDateTime(vendor.updatedAt)}</span>
      </div>
    </div>
  );
}
