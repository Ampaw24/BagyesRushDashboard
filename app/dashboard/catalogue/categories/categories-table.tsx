"use client";

import Image from "next/image";
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
  deleteCategoryAction,
  saveCategoryAction,
  toggleCategoryStatusAction,
} from "../_actions";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import type { CategoryRow } from "@/lib/mappers/catalogue.mapper";
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

type Dialog = { kind: "form"; category: CategoryRow | null } | { kind: "delete"; category: CategoryRow } | null;

export function CategoriesTable({
  categories,
  pagination,
  canManage,
}: {
  categories: CategoryRow[];
  pagination: PaginationMeta;
  canManage: boolean;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const { notify, notifySuccess } = useToast();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar searchPlaceholder="Search name or description" filters={[ACTIVE_FILTER]} />
        {canManage && (
          <button
            type="button"
            onClick={() => setDialog({ kind: "form", category: null })}
            className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
          >
            <PlusIcon className="h-4 w-4" />
            New category
          </button>
        )}
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="No categories match your filters"
          description="Create a category or widen the filters to see more."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Category</TableHeadCell>
                <TableHeadCell>Description</TableHeadCell>
                <TableHeadCell>Order</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
                <TableHeadCell>
                  <span className="sr-only">Actions</span>
                </TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2.5">
                      {category.imageUrl ? (
                        <Image
                          src={category.imageUrl}
                          alt=""
                          width={32}
                          height={32}
                          // Remote host is the API, which is not in next.config
                          // images.remotePatterns — unoptimized keeps it simple.
                          unoptimized
                          className="h-8 w-8 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="h-8 w-8 shrink-0 rounded-lg bg-surface-muted" />
                      )}
                      {category.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-text-secondary">{category.description ?? "—"}</TableCell>
                  <TableCell className="text-text-secondary">{category.displayOrder}</TableCell>
                  <TableCell>
                    <Badge meta={category.isActive ? ACTIVE_META : INACTIVE_META} />
                  </TableCell>
                  <TableCell className="text-text-secondary">{formatDate(category.createdAt)}</TableCell>
                  <TableCell>
                    {canManage ? (
                      <ActionMenu
                        items={[
                          { label: "Edit", onClick: () => setDialog({ kind: "form", category }) },
                          {
                            label: category.isActive ? "Deactivate" : "Activate",
                            icon: RefreshIcon,
                            onClick: async () => notify(await toggleCategoryStatusAction(category.id)),
                          },
                          {
                            label: "Delete",
                            icon: TrashIcon,
                            danger: true,
                            onClick: () => setDialog({ kind: "delete", category }),
                          },
                        ]}
                      />
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </TableShell>

          <Pagination pagination={pagination} />
        </>
      )}

      {dialog?.kind === "form" && (
        <CategoryForm category={dialog.category} onClose={() => setDialog(null)} />
      )}

      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Delete category"
          description={`${dialog.category.name} will be removed. This is refused while menu items or vendors still use it.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={async () => {
            const result = await deleteCategoryAction(dialog.category.id);
            notifySuccess(result);
            if (result.ok) setDialog(null);
            return result;
          }}
        />
      )}
    </div>
  );
}

function CategoryForm({ category, onClose }: { category: CategoryRow | null; onClose: () => void }) {
  const { notifySuccess } = useToast();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    // An untouched file input still submits an empty File; dropping it keeps
    // the existing image on update instead of failing the image rule.
    const image = form.get("image");
    if (image instanceof File && image.size === 0) form.delete("image");

    // Laravel's `boolean` rule accepts 1/0 but not an absent checkbox, so the
    // value is always sent explicitly.
    form.set("is_active", form.get("is_active") !== null ? "1" : "0");

    setPending(true);
    setMessage("");
    setErrors({});

    const result = await saveCategoryAction(category?.id ?? null, form);
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
      title={category ? `Edit ${category.name}` : "New category"}
      submitLabel={category ? "Save changes" : "Create category"}
      pending={pending}
      message={message}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <Field label="Name" error={fieldError(errors, "name")}>
        <input name="name" required maxLength={255} defaultValue={category?.name ?? ""} className={inputClass} />
      </Field>

      <Field label="Description" error={fieldError(errors, "description")}>
        <textarea
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={category?.description ?? ""}
          className={textareaClass}
        />
      </Field>

      <Field
        label="Image"
        error={fieldError(errors, "image")}
        hint={
          category?.imageUrl
            ? "JPEG, PNG, JPG or GIF, up to 2 MB. Leave empty to keep the current image."
            : "JPEG, PNG, JPG or GIF, up to 2 MB."
        }
      >
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/gif"
          className="w-full text-sm text-text-secondary file:mr-3 file:h-9 file:rounded-lg file:border-0 file:bg-surface-muted file:px-3 file:text-sm file:font-medium file:text-text-secondary"
        />
      </Field>

      <Field label="Display order" error={fieldError(errors, "display_order")}>
        <input
          name="display_order"
          type="number"
          min={0}
          defaultValue={category?.displayOrder ?? 0}
          className={inputClass}
        />
      </Field>

      <CheckboxField name="is_active" label="Active" defaultChecked={category?.isActive ?? true} />
    </FormDialog>
  );
}
