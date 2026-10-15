"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { DetailDialog, DetailField, DetailSection } from "../../_components/detail-dialog";
import { Badge } from "../../_components/status-badge";
import { ImageLightbox } from "../../_components/image-lightbox";
import { reportStatusMeta } from "../../_lib/status";
import { formatDateTime, formatDateTimeOrDash } from "../../_lib/format";
import { OrderQuickViewLink } from "../../orders/_components/order-quick-view-link";
import { ReportTriage } from "./report-triage";
import { loadReportQuickViewAction, type ReportQuickView } from "../_actions";
import type { ReportRow } from "@/lib/mappers/report.mapper";

/**
 * One complaint, its evidence and its triage, without leaving the queue.
 *
 * Complaints are worked top to bottom, and opening each as a page lost the
 * status filter on the way back. The evidence previews in place rather than in
 * a new tab for the same reason.
 *
 * The header renders from the list row so the dialog is never blank; the body
 * comes from a fresh read, because the attachment links on the row are signed
 * and may have expired since the list loaded.
 */
export function ViewReportDialog({
  report: row,
  onClose,
}: {
  report: ReportRow;
  onClose: () => void;
}) {
  const [view, setView] = useState<ReportQuickView | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [preview, setPreview] = useState<{ src: string; index: number } | null>(null);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    let active = true;

    loadReportQuickViewAction(row.id).then((result) => {
      if (!active) return;
      if (result.ok) {
        setView(result.data);
        setError("");
      } else {
        setError(result.message);
      }
    });

    return () => {
      active = false;
    };
  }, [row.id, version]);

  const report = view?.report ?? row;

  return (
    <DetailDialog
      label="View report"
      onClose={onClose}
      header={
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="flex flex-wrap items-center gap-3 break-words text-base font-semibold text-foreground">
            {report.reasonLabel}
            <Badge meta={reportStatusMeta[report.status]} />
          </h2>
          <span className="break-words text-xs text-text-muted">
            {report.targetTypeLabel} · filed {formatDateTime(report.createdAt)}
          </span>
        </div>
      }
      footer={
        <Link
          href={`/dashboard/support/${report.id}`}
          className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
        >
          Open full page
        </Link>
      }
    >
      {error && (
        <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface-muted/40 p-4">
        <h3 className="text-sm font-semibold text-foreground">What they said</h3>
        <p className="whitespace-pre-wrap break-words text-sm text-text-secondary">
          {report.description}
        </p>
      </section>

      {!view ? (
        <p className="py-6 text-center text-sm text-text-muted">Loading evidence…</p>
      ) : (
        report.attachments.length > 0 && (
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              Evidence ({report.attachments.length})
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {report.attachments.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setPreview({ src: url, index })}
                  className="overflow-hidden rounded-lg border border-border-subtle transition duration-150 hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Attachment ${index + 1}`}
                    className="h-28 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </section>
        )
      )}

      {report.resolutionNote && (
        <section className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface-muted/40 p-4">
          <h3 className="text-sm font-semibold text-foreground">Resolution</h3>
          <p className="whitespace-pre-wrap break-words text-sm text-text-secondary">
            {report.resolutionNote}
          </p>
          <p className="text-xs text-text-muted">
            {report.resolvedBy ?? "Staff"} · {formatDateTimeOrDash(report.resolvedAt)}
          </p>
        </section>
      )}

      <DetailSection title="Reported by" columns={3}>
        <DetailField label="Name" value={report.reporterName} />
        <DetailField
          label="Role"
          value={<span className="capitalize">{report.reporterRole}</span>}
        />
        <DetailField label="Phone" value={report.reporterPhone ?? "—"} />
      </DetailSection>

      <DetailSection title="About">
        <DetailField label={report.targetTypeLabel} value={report.targetName} />
        {report.targetPhone && <DetailField label="Phone" value={report.targetPhone} />}
        {report.orderId && (
          <DetailField
            label="Order"
            value={
              <OrderQuickViewLink
                orderId={report.orderId}
                orderNumber={report.orderNumber ?? undefined}
              />
            }
          />
        )}
        {(report.targetType === "vendor" || report.targetType === "rider") && report.targetId && (
          <DetailField
            label="Profile"
            value={
              <Link
                href={`/dashboard/${report.targetType}s/${report.targetId}`}
                className="text-brand transition duration-150 hover:opacity-80"
              >
                Open {report.targetType}
              </Link>
            }
          />
        )}
      </DetailSection>

      {view?.canManage && report.isOpen && (
        <ReportTriage reportId={report.id} status={report.status} onChanged={reload} />
      )}

      {preview && (
        <ImageLightbox
          src={preview.src}
          alt={`Attachment ${preview.index + 1}`}
          caption={`${report.reasonLabel} · attachment ${preview.index + 1}`}
          onClose={() => setPreview(null)}
        />
      )}
    </DetailDialog>
  );
}
