import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { Badge } from "../../_components/status-badge";
import { reportStatusMeta } from "../../_lib/status";
import { formatDateTime, formatDateTimeOrDash } from "../../_lib/format";
import { ReportTriage } from "../_components/report-triage";
import { getReport } from "@/lib/services/reports.service";
import { toReportRow } from "@/lib/mappers/report.mapper";
import { can, getPermissions } from "@/lib/auth/guard";
import { ApiRequestError } from "@/lib/api/errors";

export const metadata: Metadata = {
  title: "Report — BagyesRUSH",
};

/**
 * One complaint, with its evidence.
 *
 * The attachment URLs are short-lived signed links off the private disk —
 * complaint photos are user evidence, not public art — so they expire while
 * this page sits open. A reload mints fresh ones.
 */
export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const permissions = await getPermissions();

  if (!can(permissions, "reports.view")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Report" description="One complaint and its evidence." />
        <NoPermissionState what="reports" />
      </div>
    );
  }

  const { id } = await params;
  const reportId = Number.parseInt(id, 10);

  if (!Number.isFinite(reportId)) notFound();

  let report;
  try {
    report = toReportRow(await getReport(reportId));
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={report.reasonLabel}
        description={`${report.targetTypeLabel} · filed ${formatDateTime(report.createdAt)}`}
        action={<Badge meta={reportStatusMeta[report.status]} />}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">What they said</h2>
            <p className="whitespace-pre-wrap text-sm text-text-secondary">{report.description}</p>
          </section>

          {report.attachments.length > 0 && (
            <section className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">
                Evidence ({report.attachments.length})
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {report.attachments.map((url, index) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-lg border border-border-subtle transition duration-150 hover:border-brand"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Attachment ${index + 1}`}
                      className="h-32 w-full object-cover"
                    />
                  </a>
                ))}
              </div>
              <p className="text-xs text-text-muted">
                These links expire. Reload the page if an image stops loading.
              </p>
            </section>
          )}

          {report.resolutionNote && (
            <section className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">Resolution</h2>
              <p className="whitespace-pre-wrap text-sm text-text-secondary">
                {report.resolutionNote}
              </p>
              <p className="text-xs text-text-muted">
                {report.resolvedBy ?? "Staff"} · {formatDateTimeOrDash(report.resolvedAt)}
              </p>
            </section>
          )}
        </div>

        <aside className="flex h-fit flex-col gap-5">
          <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">Reported by</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-text-muted">Name</dt>
                <dd className="text-right text-foreground">{report.reporterName}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-text-muted">Role</dt>
                <dd className="text-right capitalize text-foreground">{report.reporterRole}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-text-muted">Phone</dt>
                <dd className="text-right text-foreground">{report.reporterPhone ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">About</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-text-muted">{report.targetTypeLabel}</dt>
                <dd className="text-right text-foreground">{report.targetName}</dd>
              </div>
              {report.targetPhone && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-muted">Phone</dt>
                  <dd className="text-right text-foreground">{report.targetPhone}</dd>
                </div>
              )}
              {report.orderId && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-muted">Order</dt>
                  <dd className="text-right">
                    <Link
                      href={`/dashboard/orders/${report.orderId}`}
                      className="text-brand transition duration-150 hover:underline"
                    >
                      {report.orderNumber ?? `#${report.orderId}`}
                    </Link>
                  </dd>
                </div>
              )}
              {report.targetType === "vendor" && report.targetId && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-muted">Profile</dt>
                  <dd className="text-right">
                    <Link
                      href={`/dashboard/vendors/${report.targetId}`}
                      className="text-brand transition duration-150 hover:underline"
                    >
                      Open vendor
                    </Link>
                  </dd>
                </div>
              )}
              {report.targetType === "rider" && report.targetId && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-muted">Profile</dt>
                  <dd className="text-right">
                    <Link
                      href={`/dashboard/riders/${report.targetId}`}
                      className="text-brand transition duration-150 hover:underline"
                    >
                      Open rider
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {can(permissions, "reports.manage") && report.isOpen && (
            <ReportTriage reportId={report.id} status={report.status} />
          )}
        </aside>
      </div>
    </div>
  );
}
