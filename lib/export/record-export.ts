/**
 * Exporting one record, as it appears on screen.
 *
 * This is deliberately not the existing `/admin/exports/{resource}` path. That
 * one exports a *list* through the backend, with the six or so columns a table
 * needs — and what staff asked for here is the detail view: every field on the
 * rider, the vendor, the customer, including the ones the list never carried.
 * Sending that back to the server to re-fetch and re-shape data the screen is
 * already holding would be work for its own sake, and it could not cover the
 * customer dialog at all, because there is no per-customer export definition.
 *
 * So the record is built from what the view is already rendering. Two formats,
 * because they answer different needs:
 *
 * - **Print / PDF** for a record somebody files, emails or hands to a partner.
 *   The browser's own print-to-PDF is used rather than a PDF library: it needs
 *   no dependency, it honours the page size the person actually has, and it is
 *   the one PDF route that cannot drift from what they see.
 * - **CSV** for a record somebody pastes into a spreadsheet. Laid out as
 *   Section/Field/Value rows rather than one very wide row, because a single
 *   record with forty columns is unreadable in a spreadsheet.
 */

export type ExportField = {
  label: string;
  /** Pre-formatted. The screen already knows how to render its own values. */
  value: string;
};

export type ExportSection = {
  title: string;
  fields: ExportField[];
};

export type ExportableRecord = {
  /** "Kofi Mensah" — names the file and heads the printed page. */
  title: string;
  /** "RID-0042 · joined 3 Sept 2026" */
  subtitle?: string;
  /** "Rider", "Customer" — what kind of record this is. */
  kind: string;
  sections: ExportSection[];
};

/** `Kofi Mensah` → `kofi-mensah`, for a filename that survives every OS. */
function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "record"
  );
}

function filename(record: ExportableRecord, extension: string): string {
  const stamp = new Date().toISOString().slice(0, 10);

  return `${slug(record.kind)}-${slug(record.title)}-${stamp}.${extension}`;
}

/**
 * RFC 4180 quoting.
 *
 * Every field goes through this, not only the ones that look risky: addresses
 * carry commas, rejection reasons carry quotes and newlines, and a value that
 * is safe today becomes unsafe the moment somebody types into it.
 */
function csvCell(value: string): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function triggerDownload(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Revoked on the next tick rather than immediately: Safari cancels an
  // in-flight download when the object URL is released synchronously.
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function downloadRecordCsv(record: ExportableRecord): void {
  const rows: string[] = [["Section", "Field", "Value"].map(csvCell).join(",")];

  for (const section of record.sections) {
    for (const field of section.fields) {
      rows.push([section.title, field.label, field.value].map(csvCell).join(","));
    }
  }

  // The BOM is what makes Excel read this as UTF-8. Without it "GH₵" and any
  // accented name arrive mojibake, which is the first thing anybody notices.
  const blob = new Blob([`﻿${rows.join("\r\n")}`], {
    type: "text/csv;charset=utf-8;",
  });

  triggerDownload(blob, filename(record, "csv"));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function printableHtml(record: ExportableRecord): string {
  const sections = record.sections
    .filter((section) => section.fields.length > 0)
    .map(
      (section) => `
        <section>
          <h2>${escapeHtml(section.title)}</h2>
          <table>
            ${section.fields
              .map(
                (field) => `
                  <tr>
                    <th>${escapeHtml(field.label)}</th>
                    <td>${escapeHtml(field.value)}</td>
                  </tr>`,
              )
              .join("")}
          </table>
        </section>`,
    )
    .join("");

  // Printed on a date, by a dashboard, about a record - all three matter when
  // the sheet turns up in a folder six months later with no other context.
  const printedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(record.title)}</title>
<style>
  @page { margin: 18mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1c1917;
    font-size: 12px;
    line-height: 1.5;
  }
  header { border-bottom: 2px solid #1c1917; padding-bottom: 10px; margin-bottom: 18px; }
  .kind { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #78716c; }
  h1 { font-size: 20px; margin: 4px 0 2px; }
  .subtitle { color: #57534e; font-size: 12px; }
  section { margin-bottom: 16px; break-inside: avoid; }
  h2 {
    font-size: 11px; text-transform: uppercase; letter-spacing: .06em;
    color: #78716c; margin: 0 0 6px; padding-bottom: 4px;
    border-bottom: 1px solid #e7e5e4;
  }
  table { width: 100%; border-collapse: collapse; }
  tr { break-inside: avoid; }
  th, td { text-align: left; vertical-align: top; padding: 4px 0; }
  th { width: 38%; font-weight: 500; color: #57534e; padding-right: 12px; }
  td { color: #1c1917; word-break: break-word; }
  footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #e7e5e4; font-size: 10px; color: #a8a29e; }
</style>
</head>
<body>
  <header>
    <div class="kind">${escapeHtml(record.kind)}</div>
    <h1>${escapeHtml(record.title)}</h1>
    ${record.subtitle ? `<div class="subtitle">${escapeHtml(record.subtitle)}</div>` : ""}
  </header>
  ${sections}
  <footer>BagyesRUSH · generated ${escapeHtml(printedAt)}</footer>
</body>
</html>`;
}

/**
 * Print the record, which is also how it becomes a PDF.
 *
 * Rendered into a hidden iframe rather than a popup window. A popup is what
 * most examples reach for, but it is blocked often enough to be unreliable and
 * the failure is silent — nothing happens and the admin assumes the button is
 * broken. An iframe needs no permission and cannot be blocked.
 */
export function printRecord(record: ExportableRecord): void {
  const frame = document.createElement("iframe");

  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";

  frame.onload = () => {
    const view = frame.contentWindow;

    if (!view) {
      frame.remove();

      return;
    }

    view.focus();
    view.print();

    // Removed after the dialog closes. Tearing the iframe down synchronously
    // cancels the print in Safari, which renders from the live document.
    const cleanup = () => setTimeout(() => frame.remove(), 500);

    view.onafterprint = cleanup;
    setTimeout(cleanup, 60_000);
  };

  document.body.appendChild(frame);

  const doc = frame.contentDocument;

  if (!doc) {
    frame.remove();

    return;
  }

  doc.open();
  doc.write(printableHtml(record));
  doc.close();
}

/**
 * The record as WhatsApp text.
 *
 * WhatsApp cannot be handed a file through a link, so this sends the record as
 * a message rather than an attachment. That is the right trade for what it is
 * used for: relaying a rider's details to a partner, or a vendor's to someone
 * onboarding them, from a phone. Anybody who needs the document itself uses
 * Print or CSV.
 *
 * `*bold*` is WhatsApp's own markup, so section headings survive the trip.
 */
function whatsappText(record: ExportableRecord): string {
  const lines: string[] = [`*${record.kind}: ${record.title}*`];

  if (record.subtitle) lines.push(record.subtitle);

  for (const section of record.sections) {
    if (section.fields.length === 0) continue;

    lines.push("", `*${section.title}*`);

    for (const field of section.fields) {
      lines.push(`${field.label}: ${field.value}`);
    }
  }

  lines.push("", "Sent from the BagyesRUSH dashboard");

  return lines.join("\n");
}

/**
 * Open WhatsApp with the record ready to send.
 *
 * No recipient is set. `wa.me` then asks who to send it to, which is what
 * somebody sharing a record actually wants — the same choice the list export
 * makes, where the phone number is optional for exactly this reason.
 *
 * Opened via `window.open` with `noopener`: this is a genuine user-initiated
 * navigation to another origin, so it is not blocked, and the dashboard tab
 * stays where it is.
 */
export function shareRecordOnWhatsApp(record: ExportableRecord): void {
  const text = encodeURIComponent(whatsappText(record));

  window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
}
