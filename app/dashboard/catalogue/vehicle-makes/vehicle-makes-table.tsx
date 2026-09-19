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
import { CheckboxField, Field, FormDialog, inputClass } from "../_components/form-dialog";
import {
  deleteVehicleMakeAction,
  saveVehicleMakeAction,
  toggleVehicleMakeStatusAction,
} from "../_actions";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import type { VehicleMakeRow } from "@/lib/mappers/vehicle.mapper";
import type { PaginationMeta } from "@/lib/api/types";

export type ParentType = { id: number; name: string; isActive: boolean };

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
  | { kind: "form"; make: VehicleMakeRow | null }
  | { kind: "delete"; make: VehicleMakeRow }
  | null;

export function VehicleMakesTable({
  makes,
  types,
  pagination,
}: {
  makes: VehicleMakeRow[];
  types: ParentType[];
  pagination: PaginationMeta;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const { notify, notifySuccess } = useToast();

  const typeFilter: SelectFilter = {
    key: "vehicle_type_id",
    label: "Vehicle type",
    allLabel: "All types",
    options: types.map((type) => ({ value: String(type.id), label: type.name })),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar searchPlaceholder="Search make" filters={[typeFilter, ACTIVE_FILTER]} />
        <button
          type="button"
          onClick={() => setDialog({ kind: "form", make: null })}
          disabled={types.length === 0}
          className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          New make
        </button>
      </div>

      {makes.length === 0 ? (
        <EmptyState
          title="No vehicle makes match your filters"
          description={
            types.length === 0
              ? "Create a vehicle type first — a make has to be filed under one."
              : "Create a make or widen the filters to see more."
          }
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Make</TableHeadCell>
                <TableHeadCell>Vehicle type</TableHeadCell>
                <TableHeadCell>Models</TableHeadCell>
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
              {makes.map((make) => {
                const inUse = (make.ridersCount ?? 0) > 0 || (make.modelsCount ?? 0) > 0;

                return (
                  <tr key={make.id}>
                    <TableCell className="font-medium">{make.name}</TableCell>
                    <TableCell className="text-text-secondary">{make.vehicleTypeName ?? "—"}</TableCell>
                    <TableCell className="text-text-secondary">{make.modelsCount ?? "—"}</TableCell>
                    <TableCell className="text-text-secondary">{make.ridersCount ?? "—"}</TableCell>
                    <TableCell className="text-text-secondary">{make.displayOrder}</TableCell>
                    <TableCell>
                      <Badge meta={make.isActive ? ACTIVE_META : INACTIVE_META} />
                    </TableCell>
                    <TableCell className="text-text-secondary">{formatDate(make.createdAt)}</TableCell>
                    <TableCell>
                      <ActionMenu
                        items={[
                          { label: "Edit", onClick: () => setDialog({ kind: "form", make }) },
                          {
                            label: make.isActive ? "Deactivate" : "Activate",
                            icon: RefreshIcon,
                            onClick: async () => notify(await toggleVehicleMakeStatusAction(make.id)),
                          },
                          {
                            label: "Delete",
                            icon: TrashIcon,
                            danger: true,
                            disabled: inUse,
                            disabledReason: "Riders or models still reference this make.",
                            onClick: () => setDialog({ kind: "delete", make }),
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
        <VehicleMakeForm make={dialog.make} types={types} onClose={() => setDialog(null)} />
      )}

      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Delete vehicle make"
          description={`${dialog.make.name} will be removed from the makes riders can pick under ${dialog.make.vehicleTypeName ?? "this type"}.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={async () => {
            const result = await deleteVehicleMakeAction(dialog.make.id);
            notifySuccess(result);
            if (result.ok) setDialog(null);
            return result;
          }}
        />
      )}
    </div>
  );
}

function VehicleMakeForm({
  make,
  types,
  onClose,
}: {
  make: VehicleMakeRow | null;
  types: ParentType[];
  onClose: () => void;
}) {
  const { notifySuccess } = useToast();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const displayOrder = String(form.get("display_order") ?? "").trim();

    const shared = {
      name: String(form.get("name") ?? "").trim(),
      is_active: form.get("is_active") !== null,
      ...(displayOrder === "" ? {} : { display_order: Number(displayOrder) }),
    };

    setPending(true);
    setMessage("");
    setErrors({});

    // The type is only sent on create. Moving a make to another type would
    // orphan its models and silently re-file every rider on it, so the API
    // ignores it on update and the form does not offer it.
    const result = await saveVehicleMakeAction(
      make?.id ?? null,
      make === null
        ? { ...shared, vehicle_type_id: Number(form.get("vehicle_type_id")) }
        : shared,
    );

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
      title={make ? `Edit ${make.name}` : "New vehicle make"}
      submitLabel={make ? "Save changes" : "Create make"}
      pending={pending}
      message={message}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      {make === null ? (
        <Field label="Vehicle type" error={fieldError(errors, "vehicle_type_id")}>
          <select name="vehicle_type_id" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Choose a type
            </option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
                {type.isActive ? "" : " (retired)"}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <Field label="Vehicle type" hint="A make cannot be moved to another type — delete and re-create it instead.">
          <input value={make.vehicleTypeName ?? "—"} disabled className={inputClass} />
        </Field>
      )}

      <Field label="Name" error={fieldError(errors, "name")}>
        <input name="name" required maxLength={255} defaultValue={make?.name ?? ""} className={inputClass} />
      </Field>

      <Field label="Display order" error={fieldError(errors, "display_order")}>
        <input
          name="display_order"
          type="number"
          min={0}
          defaultValue={make?.displayOrder ?? 0}
          className={inputClass}
        />
      </Field>

      <CheckboxField name="is_active" label="Active" defaultChecked={make?.isActive ?? true} />
    </FormDialog>
  );
}
