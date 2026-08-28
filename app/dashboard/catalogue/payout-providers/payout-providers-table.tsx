"use client";

import { useState, type FormEvent } from "react";

import { ActionMenu } from "../../_components/action-menu";
import { Badge } from "../../_components/status-badge";
import { ConfirmDialog } from "../../_components/confirm-dialog";
import { EmptyState } from "../../_components/empty-state";
import { FilterBar, type SelectFilter } from "../../_components/filter-bar";
import { Pagination } from "../../_components/pagination";
import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { PlusIcon, RefreshIcon, TrashIcon } from "../../_lib/icons";
import { useToast } from "../../_components/toast-provider";
import { CheckboxField, Field, FormDialog, inputClass } from "../_components/form-dialog";
import {
  deletePayoutProviderAction,
  savePayoutProviderAction,
  togglePayoutProviderStatusAction,
} from "../_actions";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import type { PayoutProviderRow } from "@/lib/mappers/catalogue.mapper";
import type { PaginationMeta } from "@/lib/api/types";
import { PAYOUT_PROVIDER_TYPES, payoutProviderTypeLabels } from "@/lib/types/enums";

const TYPE_FILTER: SelectFilter = {
  key: "type",
  label: "Type",
  allLabel: "Banks and networks",
  options: PAYOUT_PROVIDER_TYPES.map((type) => ({
    value: type,
    label: payoutProviderTypeLabels[type],
  })),
};

const ACTIVE_FILTER: SelectFilter = {
  key: "is_active",
  label: "State",
  allLabel: "Active and inactive",
  options: [
    { value: "1", label: "Active only" },
    { value: "0", label: "Inactive only" },
  ],
};

const ACTIVE_META = {
  label: "Active",
  dotClassName: "bg-status-good",
  badgeClassName: "bg-status-good/10 text-status-good",
};
const INACTIVE_META = {
  label: "Inactive",
  dotClassName: "bg-zinc-400",
  badgeClassName: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
};

type Dialog =
  | { kind: "form"; provider: PayoutProviderRow | null }
  | { kind: "delete"; provider: PayoutProviderRow }
  | null;

export function PayoutProvidersTable({
  providers,
  pagination,
}: {
  providers: PayoutProviderRow[];
  pagination: PaginationMeta;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const { notify, notifySuccess } = useToast();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar searchPlaceholder="Search name or code" filters={[TYPE_FILTER, ACTIVE_FILTER]} />
        <button
          type="button"
          onClick={() => setDialog({ kind: "form", provider: null })}
          className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
        >
          <PlusIcon className="h-4 w-4" />
          New provider
        </button>
      </div>

      {providers.length === 0 ? (
        <EmptyState
          title="No providers match your filters"
          description="Add one, or widen the filters to see more."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Provider</TableHeadCell>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>Code</TableHeadCell>
                <TableHeadCell>In use</TableHeadCell>
                <TableHeadCell>Order</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>
                  <span className="sr-only">Actions</span>
                </TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {providers.map((provider) => {
                // The backend refuses to delete a provider anyone is paid
                // through, so the option is disabled with the reason up front.
                const inUse = provider.vendorCount + provider.riderCount > 0;

                return (
                  <tr key={provider.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2.5">
                        {/* A logo on the row is how an admin spots a missing
                            one — the mobile apps render this list with them. */}
                        {provider.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={provider.logoUrl}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded border border-border-subtle object-contain"
                          />
                        ) : (
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-dashed border-border-subtle text-[10px] font-normal text-text-muted"
                            title="No logo uploaded"
                          >
                            —
                          </span>
                        )}
                        <span className="flex flex-col">
                          {provider.name}
                          {provider.shortName && (
                            <span className="text-xs font-normal text-text-muted">
                              {provider.shortName}
                            </span>
                          )}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {payoutProviderTypeLabels[provider.type]}
                    </TableCell>
                    <TableCell className="text-text-secondary">{provider.code ?? "—"}</TableCell>
                    <TableCell className="text-text-secondary">
                      {inUse
                        ? [
                            provider.vendorCount > 0 ? `${provider.vendorCount} vendor` : null,
                            provider.riderCount > 0 ? `${provider.riderCount} rider` : null,
                          ]
                            .filter(Boolean)
                            .join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-text-secondary">{provider.displayOrder}</TableCell>
                    <TableCell>
                      <Badge meta={provider.isActive ? ACTIVE_META : INACTIVE_META} />
                    </TableCell>
                    <TableCell>
                      <ActionMenu
                        items={[
                          {
                            label: "Edit",
                            onClick: () => setDialog({ kind: "form", provider }),
                          },
                          {
                            label: provider.isActive ? "Deactivate" : "Activate",
                            icon: RefreshIcon,
                            onClick: async () =>
                              notify(await togglePayoutProviderStatusAction(provider.id)),
                          },
                          {
                            label: "Delete",
                            icon: TrashIcon,
                            danger: true,
                            disabled: inUse,
                            disabledReason: "Somebody is paid through this provider.",
                            onClick: () => setDialog({ kind: "delete", provider }),
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
        <ProviderForm provider={dialog.provider} onClose={() => setDialog(null)} />
      )}

      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Delete provider"
          description={`${dialog.provider.name} will no longer be offered to vendors or riders setting up a payout.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={async () => {
            const result = await deletePayoutProviderAction(dialog.provider.id);
            notifySuccess(result);
            if (result.ok) setDialog(null);
            return result;
          }}
        />
      )}
    </div>
  );
}

function ProviderForm({
  provider,
  onClose,
}: {
  provider: PayoutProviderRow | null;
  onClose: () => void;
}) {
  const { notifySuccess } = useToast();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const shortName = String(form.get("short_name") ?? "").trim();
    const code = String(form.get("code") ?? "").trim();
    const displayOrder = String(form.get("display_order") ?? "").trim();

    setPending(true);
    setMessage("");
    setErrors({});

    const logo = form.get("logo");
    const hasLogo = logo instanceof File && logo.size > 0;

    const fields = {
      type: String(form.get("type") ?? "bank") as PayoutProviderRow["type"],
      name: String(form.get("name") ?? "").trim(),
      short_name: shortName === "" ? null : shortName,
      code: code === "" ? null : code,
      is_active: form.get("is_active") !== null,
      ...(displayOrder === "" ? {} : { display_order: Number(displayOrder) }),
    };

    // Multipart only when there is actually a file: an empty file input still
    // submits a zero-byte File, which would upload nothing and blank the logo.
    let payload: typeof fields | FormData = fields;

    if (hasLogo) {
      const body = new FormData();

      for (const [key, value] of Object.entries(fields)) {
        if (value === null || value === undefined) continue;
        // Booleans have to go as 1/0: FormData stringifies, and "false" is
        // truthy to Laravel's boolean validator.
        body.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
      }

      body.append("logo", logo);
      payload = body;
    }

    const result = await savePayoutProviderAction(provider?.id ?? null, payload);

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
      title={provider ? "Edit provider" : "New provider"}
      submitLabel={provider ? "Save" : "Create"}
      pending={pending}
      message={message}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <Field
        label="Logo"
        error={fieldError(errors, "logo")}
        hint="Shown in the mobile apps when a vendor or rider picks where to be paid. PNG or SVG, up to 2MB."
      >
        <input
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className={inputClass}
        />
        {provider?.logoUrl && (
          <span className="mt-2 flex items-center gap-2 text-xs text-text-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={provider.logoUrl}
              alt=""
              className="h-8 w-8 rounded border border-border-subtle object-contain"
            />
            Leave empty to keep the current logo.
          </span>
        )}
      </Field>

      <Field label="Type" error={fieldError(errors, "type")}>
        <select name="type" defaultValue={provider?.type ?? "bank"} className={inputClass}>
          {PAYOUT_PROVIDER_TYPES.map((type) => (
            <option key={type} value={type}>
              {payoutProviderTypeLabels[type]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Name" error={fieldError(errors, "name")}>
        <input
          name="name"
          defaultValue={provider?.name ?? ""}
          required
          maxLength={255}
          className={inputClass}
        />
      </Field>

      <Field label="Short name" error={fieldError(errors, "short_name")}>
        <input
          name="short_name"
          defaultValue={provider?.shortName ?? ""}
          maxLength={64}
          placeholder="GCB, MTN"
          className={inputClass}
        />
      </Field>

      <Field
        label="Transfer code"
        error={fieldError(errors, "code")}
        hint="Paystack's bank code. Optional — a provider can be offered before it is wired to the gateway."
      >
        <input
          name="code"
          defaultValue={provider?.code ?? ""}
          maxLength={32}
          className={inputClass}
        />
      </Field>

      <Field label="Display order" error={fieldError(errors, "display_order")}>
        <input
          name="display_order"
          type="number"
          min={0}
          max={9999}
          defaultValue={provider?.displayOrder ?? 0}
          className={inputClass}
        />
      </Field>

      <CheckboxField
        name="is_active"
        label="Offered to vendors and riders"
        defaultChecked={provider?.isActive ?? true}
      />
    </FormDialog>
  );
}
