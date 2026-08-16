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
import { formatDate } from "../../_lib/format";
import { useToast } from "../../_components/toast-provider";
import { CheckboxField, Field, FormDialog, inputClass, textareaClass } from "../_components/form-dialog";
import {
  deleteBusinessTypeAction,
  saveBusinessTypeAction,
  toggleBusinessTypeStatusAction,
} from "../_actions";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import type { BusinessTypeRow } from "@/lib/mappers/catalogue.mapper";
import type { PaginationMeta } from "@/lib/api/types";

const ACTIVE_FILTER: SelectFilter = {
  key: "is_active",
  label: "State",
  allLabel: "Active and inactive",
  options: [
    { value: "1", label: "Active only" },
    { value: "0", label: "Inactive only" },
  ],
};

const ACTIVE_META = { label: "Active", dotClassName: "bg-status-good", badgeClassName: "bg-status-good/10 text-status-good" };
const INACTIVE_META = { label: "Inactive", dotClassName: "bg-zinc-400", badgeClassName: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400" };

type Dialog =
  | { kind: "form"; type: BusinessTypeRow | null }
  | { kind: "delete"; type: BusinessTypeRow }
  | null;

export function BusinessTypesTable({
  types,
  pagination,
}: {
  types: BusinessTypeRow[];
  pagination: PaginationMeta;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const { notify, notifySuccess } = useToast();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar searchPlaceholder="Search name or description" filters={[ACTIVE_FILTER]} />
        <button
          type="button"
          onClick={() => setDialog({ kind: "form", type: null })}
          className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
        >
          <PlusIcon className="h-4 w-4" />
          New business type
        </button>
      </div>

      {types.length === 0 ? (
        <EmptyState
          title="No business types match your filters"
          description="Create a type or widen the filters to see more."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Business type</TableHeadCell>
                <TableHeadCell>Description</TableHeadCell>
                <TableHeadCell>Vendors</TableHeadCell>
                <TableHeadCell>Order</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
                <TableHeadCell>
                  <span className="sr-only">Actions</span>
                </TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {types.map((type) => {
                // The backend refuses to delete a type vendors are registered
                // under, so the option is disabled with the reason up front.
                const inUse = (type.vendorsCount ?? 0) > 0;

                return (
                  <tr key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell className="text-text-secondary">{type.description ?? "—"}</TableCell>
                    <TableCell className="text-text-secondary">{type.vendorsCount ?? "—"}</TableCell>
                    <TableCell className="text-text-secondary">{type.displayOrder}</TableCell>
                    <TableCell>
                      <Badge meta={type.isActive ? ACTIVE_META : INACTIVE_META} />
                    </TableCell>
                    <TableCell className="text-text-secondary">{formatDate(type.createdAt)}</TableCell>
                    <TableCell>
                      <ActionMenu
                        items={[
                          { label: "Edit", onClick: () => setDialog({ kind: "form", type }) },
                          {
                            label: type.isActive ? "Deactivate" : "Activate",
                            icon: RefreshIcon,
                            onClick: async () => notify(await toggleBusinessTypeStatusAction(type.id)),
                          },
                          {
                            label: "Delete",
                            icon: TrashIcon,
                            danger: true,
                            disabled: inUse,
                            disabledReason: "Vendors are registered under this type.",
                            onClick: () => setDialog({ kind: "delete", type }),
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
        <BusinessTypeForm type={dialog.type} onClose={() => setDialog(null)} />
      )}

      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Delete business type"
          description={`${dialog.type.name} will be removed from the list vendors can register under.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={async () => {
            const result = await deleteBusinessTypeAction(dialog.type.id);
            notifySuccess(result);
            if (result.ok) setDialog(null);
            return result;
          }}
        />
      )}
    </div>
  );
}

function BusinessTypeForm({
  type,
  onClose,
}: {
  type: BusinessTypeRow | null;
  onClose: () => void;
}) {
  const { notifySuccess } = useToast();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const description = String(form.get("description") ?? "").trim();
    const displayOrder = String(form.get("display_order") ?? "").trim();

    setPending(true);
    setMessage("");
    setErrors({});

    // JSON here, not multipart: this endpoint takes no image, and it is the one
    // catalogue resource whose update is a PUT.
    const result = await saveBusinessTypeAction(type?.id ?? null, {
      name: String(form.get("name") ?? "").trim(),
      description: description === "" ? null : description,
      is_active: form.get("is_active") !== null,
      ...(displayOrder === "" ? {} : { display_order: Number(displayOrder) }),
    });

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
      title={type ? `Edit ${type.name}` : "New business type"}
      submitLabel={type ? "Save changes" : "Create business type"}
      pending={pending}
      message={message}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <Field label="Name" error={fieldError(errors, "name")}>
        <input name="name" required maxLength={255} defaultValue={type?.name ?? ""} className={inputClass} />
      </Field>

      <Field label="Description" error={fieldError(errors, "description")}>
        <textarea
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={type?.description ?? ""}
          className={textareaClass}
        />
      </Field>

      <Field label="Display order" error={fieldError(errors, "display_order")}>
        <input
          name="display_order"
          type="number"
          min={0}
          defaultValue={type?.displayOrder ?? 0}
          className={inputClass}
        />
      </Field>

      <CheckboxField name="is_active" label="Active" defaultChecked={type?.isActive ?? true} />
    </FormDialog>
  );
}
