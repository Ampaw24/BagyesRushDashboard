"use client";

import { useState, type FormEvent } from "react";

import { ActionMenu } from "../../_components/action-menu";
import { Badge } from "../../_components/status-badge";
import { ConfirmDialog } from "../../_components/confirm-dialog";
import { EmptyState } from "../../_components/empty-state";
import { FilterBar } from "../../_components/filter-bar";
import { Pagination } from "../../_components/pagination";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { PlusIcon, RefreshIcon, TrashIcon } from "../../_lib/icons";
import { formatDate } from "../../_lib/format";
import { useToast } from "../../_components/toast-provider";
import {
  CheckboxField,
  Field,
  FormDialog,
  inputClass,
  textareaClass,
} from "../../catalogue/_components/form-dialog";
import {
  activateRiderAgreementAction,
  deleteRiderAgreementAction,
  saveRiderAgreementAction,
} from "./_actions";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import type { RiderAgreementRow } from "@/lib/mappers/rider-agreement.mapper";
import type { PaginationMeta } from "@/lib/api/types";

const IN_FORCE = {
  label: "In force",
  dotClassName: "bg-status-good",
  badgeClassName: "bg-status-good/10 text-status-good",
};

const RETIRED = {
  label: "Retired",
  dotClassName: "bg-zinc-400",
  badgeClassName: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
};

type Dialog =
  | { kind: "form"; agreement: RiderAgreementRow | null }
  | { kind: "publish"; agreement: RiderAgreementRow }
  | { kind: "delete"; agreement: RiderAgreementRow }
  | null;

function readableSize(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function RiderAgreementManager({
  agreements,
  pagination,
}: {
  agreements: RiderAgreementRow[];
  pagination: PaginationMeta;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const { notify, notifySuccess } = useToast();

  const active = agreements.find((agreement) => agreement.isActive) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {/* Nothing published is a real state, and a serious one: riders cannot
          complete onboarding at all until there is a contract to accept. */}
      {active === null && (
        <div className="rounded-xl border border-status-critical/30 bg-status-critical/5 px-5 py-4">
          <p className="text-sm font-medium text-foreground">No agreement is in force</p>
          <p className="mt-1 text-sm text-text-secondary">
            Riders cannot finish onboarding until one is published — accepting the agreement is part
            of completing a profile, and the rider app has nothing to display.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar searchPlaceholder="Search version or title" />
        <button
          type="button"
          onClick={() => setDialog({ kind: "form", agreement: null })}
          className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
        >
          <PlusIcon className="h-4 w-4" />
          New version
        </button>
      </div>

      {agreements.length === 0 ? (
        <EmptyState
          title="No rider agreement yet"
          description="Upload the contract riders sign. You can paste the text, attach the signed PDF, or both."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Version</TableHeadCell>
                <TableHeadCell>Title</TableHeadCell>
                <TableHeadCell>Document</TableHeadCell>
                <TableHeadCell>Signed by</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Published</TableHeadCell>
                <TableHeadCell>
                  <span className="sr-only">Actions</span>
                </TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {agreements.map((agreement) => {
                // The API refuses both of these, so the reason is shown up
                // front rather than after a round trip.
                const signed = (agreement.ridersCount ?? 0) > 0;
                const undeletable = agreement.isActive || signed;

                return (
                  <tr key={agreement.id}>
                    <TableCell className="font-medium">{agreement.version}</TableCell>
                    <TableCell className="text-text-secondary">{agreement.title}</TableCell>
                    <TableCell className="text-text-secondary">
                      {agreement.fileUrl ? (
                        <a
                          href={agreement.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand underline-offset-2 hover:underline"
                        >
                          {agreement.fileName ?? "PDF"}{" "}
                          <span className="text-text-muted">({readableSize(agreement.fileSize)})</span>
                        </a>
                      ) : (
                        <span className="text-text-muted">Text only</span>
                      )}
                    </TableCell>
                    <TableCell className="text-text-secondary">{agreement.ridersCount ?? "—"}</TableCell>
                    <TableCell>
                      <Badge meta={agreement.isActive ? IN_FORCE : RETIRED} />
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {agreement.publishedAt ? formatDate(agreement.publishedAt) : "Not published"}
                    </TableCell>
                    <TableCell>
                      <ActionMenu
                        items={[
                          { label: "Edit", onClick: () => setDialog({ kind: "form", agreement }) },
                          {
                            label: "Publish",
                            icon: RefreshIcon,
                            disabled: agreement.isActive,
                            disabledReason: "This is already the agreement in force.",
                            onClick: () => setDialog({ kind: "publish", agreement }),
                          },
                          {
                            label: "Delete",
                            icon: TrashIcon,
                            danger: true,
                            disabled: undeletable,
                            disabledReason: agreement.isActive
                              ? "This is the agreement in force. Publish a replacement first."
                              : "Riders have signed this version. What somebody agreed to is part of the record.",
                            onClick: () => setDialog({ kind: "delete", agreement }),
                          },
                        ]}
                      />
                    </TableCell>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>

          <Pagination pagination={pagination} />
        </>
      )}

      {dialog?.kind === "form" && (
        <AgreementForm agreement={dialog.agreement} onClose={() => setDialog(null)} />
      )}

      {dialog?.kind === "publish" && (
        <ConfirmDialog
          title="Publish this agreement"
          description={
            active
              ? `${dialog.agreement.version} becomes the contract every new rider signs, and ${active.version} is retired. Riders who already accepted ${active.version} keep pointing at it and are asked to read the new one.`
              : `${dialog.agreement.version} becomes the contract every rider signs.`
          }
          confirmLabel="Publish"
          onCancel={() => setDialog(null)}
          onConfirm={async () => {
            const result = await activateRiderAgreementAction(dialog.agreement.id);
            notifySuccess(result);
            if (result.ok) setDialog(null);
            return result;
          }}
        />
      )}

      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Delete this version"
          description={`${dialog.agreement.version} will be removed. This is only possible because no rider has signed it.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={async () => {
            const result = await deleteRiderAgreementAction(dialog.agreement.id);
            notifySuccess(result);
            if (result.ok) setDialog(null);
            return result;
          }}
        />
      )}
    </div>
  );
}

function AgreementForm({
  agreement,
  onClose,
}: {
  agreement: RiderAgreementRow | null;
  onClose: () => void;
}) {
  const { notifySuccess } = useToast();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  // Renaming is refused once riders have signed: their records name the
  // version, and changing it would rewrite what they agreed to.
  const versionLocked = (agreement?.ridersCount ?? 0) > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    // An untouched file input still submits an empty File; dropping it keeps
    // the existing PDF on update instead of failing the file rule.
    const file = form.get("file");
    if (file instanceof File && file.size === 0) form.delete("file");

    if (versionLocked) form.delete("version");

    // Laravel's `boolean` rule accepts 1/0 but not an absent checkbox.
    if (agreement === null) {
      form.set("activate", form.get("activate") !== null ? "1" : "0");
    } else {
      form.delete("activate");
    }

    setPending(true);
    setMessage("");
    setErrors({});

    const result = await saveRiderAgreementAction(agreement?.id ?? null, form);

    setPending(false);
    notifySuccess(result);

    if (result.ok) {
      onClose();
      return;
    }

    setMessage(result.message);
    setErrors(result.errors);
  }

  return (
    <FormDialog
      title={agreement ? `Edit ${agreement.version}` : "New agreement version"}
      submitLabel={agreement ? "Save changes" : "Save agreement"}
      pending={pending}
      message={message}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <Field
        label="Version"
        error={fieldError(errors, "version")}
        hint={
          versionLocked
            ? "Riders have signed this version, so it cannot be renamed. Publish a new one instead."
            : "What a rider's record will name once they accept, e.g. 2026-09-01 or v3."
        }
      >
        <input
          name="version"
          required={!versionLocked}
          disabled={versionLocked}
          maxLength={32}
          defaultValue={agreement?.version ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Title" error={fieldError(errors, "title")}>
        <input
          name="title"
          required
          maxLength={255}
          defaultValue={agreement?.title ?? "Rider Agreement"}
          className={inputClass}
        />
      </Field>

      <Field
        label="What changed"
        error={fieldError(errors, "summary")}
        hint="A note for staff. Riders never see this."
      >
        <input name="summary" maxLength={500} defaultValue={agreement?.summary ?? ""} className={inputClass} />
      </Field>

      <Field
        label="Agreement text"
        error={fieldError(errors, "body")}
        hint="Markdown. The rider app renders this inline so the contract matches the rest of the app. Either this or a PDF is required."
      >
        <textarea name="body" rows={12} defaultValue={agreement?.body ?? ""} className={textareaClass} />
      </Field>

      <Field
        label="Signed PDF"
        error={fieldError(errors, "file")}
        hint={
          agreement?.fileUrl
            ? "PDF up to 10 MB. Leave empty to keep the current file."
            : "PDF up to 10 MB. The document itself, for anyone who wants it — and what gets produced in a dispute."
        }
      >
        <input
          name="file"
          type="file"
          accept="application/pdf"
          className="w-full text-sm text-text-secondary file:mr-3 file:h-9 file:rounded-lg file:border-0 file:bg-surface-muted file:px-3 file:text-sm file:font-medium file:text-text-secondary"
        />
      </Field>

      {agreement === null && (
        <CheckboxField
          name="activate"
          label="Publish immediately (retires the current agreement)"
          defaultChecked={false}
        />
      )}
    </FormDialog>
  );
}
