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
  deleteVehicleModelAction,
  saveVehicleModelAction,
  toggleVehicleModelStatusAction,
} from "../_actions";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import type { VehicleModelRow } from "@/lib/mappers/vehicle.mapper";
import type { PaginationMeta } from "@/lib/api/types";

export type ParentMake = { id: number; name: string; isActive: boolean; typeName: string | null };

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
  | { kind: "form"; model: VehicleModelRow | null }
  | { kind: "delete"; model: VehicleModelRow }
  | null;

/** "Honda (Motorbike)" — the same name exists under more than one type. */
function makeLabel(make: ParentMake): string {
  const base = make.typeName ? `${make.name} (${make.typeName})` : make.name;

  return make.isActive ? base : `${base} — inactive`;
}

export function VehicleModelsTable({
  models,
  makes,
  pagination,
}: {
  models: VehicleModelRow[];
  makes: ParentMake[];
  pagination: PaginationMeta;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const { notify, notifySuccess } = useToast();

  const makeFilter: SelectFilter = {
    key: "vehicle_make_id",
    label: "Make",
    allLabel: "All makes",
    options: makes.map((make) => ({ value: String(make.id), label: makeLabel(make) })),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar searchPlaceholder="Search model" filters={[makeFilter, ACTIVE_FILTER]} />
        <button
          type="button"
          onClick={() => setDialog({ kind: "form", model: null })}
          disabled={makes.length === 0}
          className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          New model
        </button>
      </div>

      {models.length === 0 ? (
        <EmptyState
          title="No vehicle models match your filters"
          description={
            makes.length === 0
              ? "Create a vehicle make first — a model has to be filed under one."
              : "Create a model or widen the filters to see more."
          }
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Model</TableHeadCell>
                <TableHeadCell>Make</TableHeadCell>
                <TableHeadCell>Vehicle type</TableHeadCell>
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
              {models.map((model) => {
                const inUse = (model.ridersCount ?? 0) > 0;

                return (
                  <tr key={model.id}>
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell className="text-text-secondary">{model.vehicleMakeName ?? "—"}</TableCell>
                    <TableCell className="text-text-secondary">{model.vehicleTypeName ?? "—"}</TableCell>
                    <TableCell className="text-text-secondary">{model.ridersCount ?? "—"}</TableCell>
                    <TableCell className="text-text-secondary">{model.displayOrder}</TableCell>
                    <TableCell>
                      <Badge meta={model.isActive ? ACTIVE_META : INACTIVE_META} />
                    </TableCell>
                    <TableCell className="text-text-secondary">{formatDate(model.createdAt)}</TableCell>
                    <TableCell>
                      <ActionMenu
                        items={[
                          { label: "Edit", onClick: () => setDialog({ kind: "form", model }) },
                          {
                            label: model.isActive ? "Deactivate" : "Activate",
                            icon: RefreshIcon,
                            onClick: async () => notify(await toggleVehicleModelStatusAction(model.id)),
                          },
                          {
                            label: "Delete",
                            icon: TrashIcon,
                            danger: true,
                            disabled: inUse,
                            disabledReason: "Riders are registered on this model.",
                            onClick: () => setDialog({ kind: "delete", model }),
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
        <VehicleModelForm model={dialog.model} makes={makes} onClose={() => setDialog(null)} />
      )}

      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Delete vehicle model"
          description={`${dialog.model.name} will be removed from the models riders can pick under ${dialog.model.vehicleMakeName ?? "this make"}.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={async () => {
            const result = await deleteVehicleModelAction(dialog.model.id);
            notifySuccess(result);
            if (result.ok) setDialog(null);
            return result;
          }}
        />
      )}
    </div>
  );
}

function VehicleModelForm({
  model,
  makes,
  onClose,
}: {
  model: VehicleModelRow | null;
  makes: ParentMake[];
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

    const result = await saveVehicleModelAction(
      model?.id ?? null,
      model === null ? { ...shared, vehicle_make_id: Number(form.get("vehicle_make_id")) } : shared,
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
      title={model ? `Edit ${model.name}` : "New vehicle model"}
      submitLabel={model ? "Save changes" : "Create model"}
      pending={pending}
      message={message}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      {model === null ? (
        <Field label="Make" error={fieldError(errors, "vehicle_make_id")}>
          <select name="vehicle_make_id" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Choose a make
            </option>
            {makes.map((make) => (
              <option key={make.id} value={make.id}>
                {makeLabel(make)}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <Field label="Make" hint="A model cannot be moved to another make — delete and re-create it instead.">
          <input value={model.vehicleMakeName ?? "—"} disabled className={inputClass} />
        </Field>
      )}

      <Field label="Name" error={fieldError(errors, "name")}>
        <input name="name" required maxLength={255} defaultValue={model?.name ?? ""} className={inputClass} />
      </Field>

      <Field label="Display order" error={fieldError(errors, "display_order")}>
        <input
          name="display_order"
          type="number"
          min={0}
          defaultValue={model?.displayOrder ?? 0}
          className={inputClass}
        />
      </Field>

      <CheckboxField name="is_active" label="Active" defaultChecked={model?.isActive ?? true} />
    </FormDialog>
  );
}
