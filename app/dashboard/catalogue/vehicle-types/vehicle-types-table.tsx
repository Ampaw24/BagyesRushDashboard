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
  deleteVehicleTypeAction,
  saveVehicleTypeAction,
  toggleVehicleTypeStatusAction,
} from "../_actions";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import type { VehicleTypeRow } from "@/lib/mappers/vehicle.mapper";
import { PARCEL_SIZE_LABELS, PARCEL_SIZES, type ParcelSize } from "@/lib/types/enums";
import type { PaginationMeta } from "@/lib/api/types";

const ACTIVE_FILTER: SelectFilter = {
  key: "is_active",
  label: "State",
  allLabel: "Active and inactive",
  options: [
    { value: "1", label: "In the fleet" },
    { value: "0", label: "Retired" },
  ],
};

const ACTIVE_META = { label: "Active", dotClassName: "bg-status-good", badgeClassName: "bg-status-good/10 text-status-good" };
const INACTIVE_META = { label: "Inactive", dotClassName: "bg-zinc-400", badgeClassName: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400" };

type Dialog =
  | { kind: "form"; type: VehicleTypeRow | null }
  | { kind: "delete"; type: VehicleTypeRow }
  | null;

export function VehicleTypesTable({
  types,
  pagination,
}: {
  types: VehicleTypeRow[];
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
          New vehicle type
        </button>
      </div>

      {types.length === 0 ? (
        <EmptyState
          title="No vehicle types match your filters"
          description="Create a type or widen the filters to see more."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Vehicle type</TableHeadCell>
                <TableHeadCell>Plate</TableHeadCell>
                <TableHeadCell>Carries up to</TableHeadCell>
                <TableHeadCell>Makes</TableHeadCell>
                <TableHeadCell>Riders</TableHeadCell>
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
                // The backend refuses to delete a type that riders or makes
                // still reference, so the option is disabled with the reason
                // up front rather than after a round trip.
                const inUse = (type.ridersCount ?? 0) > 0 || (type.makesCount ?? 0) > 0;

                return (
                  <tr key={type.id}>
                    <TableCell className="font-medium">
                      {type.name}
                      <span className="ml-2 font-normal text-text-muted">{type.slug}</span>
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {type.requiresPlate ? "Required" : "None"}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {type.maxParcelSizeLabel ?? "—"}
                    </TableCell>
                    <TableCell className="text-text-secondary">{type.makesCount ?? "—"}</TableCell>
                    <TableCell className="text-text-secondary">{type.ridersCount ?? "—"}</TableCell>
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
                            label: type.isActive ? "Retire from the fleet" : "Add to the fleet",
                            icon: RefreshIcon,
                            onClick: async () => notify(await toggleVehicleTypeStatusAction(type.id)),
                          },
                          {
                            label: "Delete",
                            icon: TrashIcon,
                            danger: true,
                            disabled: inUse,
                            disabledReason: "Riders or makes still reference this type. Retire it instead.",
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

      {dialog?.kind === "form" && <VehicleTypeForm type={dialog.type} onClose={() => setDialog(null)} />}

      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Delete vehicle type"
          description={`${dialog.type.name} will be removed from the list riders can register under. Retiring it instead keeps the history intact.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={async () => {
            const result = await deleteVehicleTypeAction(dialog.type.id);
            notifySuccess(result);
            if (result.ok) setDialog(null);
            return result;
          }}
        />
      )}
    </div>
  );
}

function VehicleTypeForm({ type, onClose }: { type: VehicleTypeRow | null; onClose: () => void }) {
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

    const result = await saveVehicleTypeAction(type?.id ?? null, {
      name: String(form.get("name") ?? "").trim(),
      description: description === "" ? null : description,
      requires_plate: form.get("requires_plate") !== null,
      max_parcel_size: String(form.get("max_parcel_size") ?? "medium") as ParcelSize,
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
      title={type ? `Edit ${type.name}` : "New vehicle type"}
      submitLabel={type ? "Save changes" : "Create vehicle type"}
      pending={pending}
      message={message}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <Field
        label="Name"
        error={fieldError(errors, "name")}
        hint={type ? `Apps match on \`${type.slug}\`, which a rename leaves alone.` : undefined}
      >
        <input name="name" required maxLength={255} defaultValue={type?.name ?? ""} className={inputClass} />
      </Field>

      <Field label="Description" error={fieldError(errors, "description")}>
        <textarea
          name="description"
          rows={2}
          maxLength={500}
          defaultValue={type?.description ?? ""}
          className={textareaClass}
        />
      </Field>

      <Field
        label="Largest parcel it can carry"
        error={fieldError(errors, "max_parcel_size")}
        hint="Decides which riders are offered a parcel job, and which sizes customers can pick at all."
      >
        <select name="max_parcel_size" defaultValue={type?.maxParcelSize ?? "medium"} className={inputClass}>
          {PARCEL_SIZES.map((size) => (
            <option key={size} value={size}>
              {PARCEL_SIZE_LABELS[size]}
            </option>
          ))}
        </select>
      </Field>

      <CheckboxField
        name="requires_plate"
        label="Requires a number plate"
        defaultChecked={type?.requiresPlate ?? true}
      />

      <Field label="Display order" error={fieldError(errors, "display_order")}>
        <input
          name="display_order"
          type="number"
          min={0}
          defaultValue={type?.displayOrder ?? 0}
          className={inputClass}
        />
      </Field>

      <CheckboxField name="is_active" label="In the fleet (riders may register on it)" defaultChecked={type?.isActive ?? true} />
    </FormDialog>
  );
}
