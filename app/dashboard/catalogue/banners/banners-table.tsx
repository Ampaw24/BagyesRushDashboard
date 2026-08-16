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
import { promoCodeStateMeta } from "../../_lib/status";
import { useToast } from "../../_components/toast-provider";
import { CheckboxField, Field, FormDialog, inputClass, textareaClass } from "../_components/form-dialog";
import { deleteBannerAction, saveBannerAction, toggleBannerStatusAction } from "../_actions";
import { fieldError, type FieldErrors } from "@/lib/api/errors";
import { bannerState, type BannerRow } from "@/lib/mappers/catalogue.mapper";
import type { PaginationMeta } from "@/lib/api/types";
import {
  BANNER_LINK_TYPES,
  BANNER_PLACEMENTS,
  bannerLinkTypeLabels,
  bannerLinkValueHints,
  bannerPlacementLabels,
  type BannerLinkType,
} from "@/lib/types/enums";

const PLACEMENT_FILTER: SelectFilter = {
  key: "placement",
  label: "Placement",
  allLabel: "All placements",
  options: BANNER_PLACEMENTS.map((p) => ({ value: p, label: bannerPlacementLabels[p] })),
};

const LINK_FILTER: SelectFilter = {
  key: "link_type",
  label: "Link",
  allLabel: "All link types",
  options: BANNER_LINK_TYPES.map((t) => ({ value: t, label: bannerLinkTypeLabels[t] })),
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

/** `<input type="date">` wants YYYY-MM-DD; the API returns a full ISO string. */
function toDateInput(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

type Dialog = { kind: "form"; banner: BannerRow | null } | { kind: "delete"; banner: BannerRow } | null;

export function BannersTable({
  banners,
  pagination,
}: {
  banners: BannerRow[];
  pagination: PaginationMeta;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const { notify, notifySuccess } = useToast();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar
          searchPlaceholder="Search title, subtitle or description"
          filters={[PLACEMENT_FILTER, LINK_FILTER, ACTIVE_FILTER]}
        />
        <button
          type="button"
          onClick={() => setDialog({ kind: "form", banner: null })}
          className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
        >
          <PlusIcon className="h-4 w-4" />
          New banner
        </button>
      </div>

      {banners.length === 0 ? (
        <EmptyState
          title="No banners match your filters"
          description="Create a banner or widen the filters to see more."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <TableHeadCell>Banner</TableHeadCell>
                <TableHeadCell>Placement</TableHeadCell>
                <TableHeadCell>Link</TableHeadCell>
                <TableHeadCell>Order</TableHeadCell>
                <TableHeadCell>Window</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>
                  <span className="sr-only">Actions</span>
                </TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2.5">
                      {banner.imageUrl ? (
                        <Image
                          src={banner.imageUrl}
                          alt=""
                          width={56}
                          height={32}
                          unoptimized
                          className="h-8 w-14 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <span className="h-8 w-14 shrink-0 rounded-md bg-surface-muted" />
                      )}
                      <span className="flex flex-col">
                        {banner.title}
                        {banner.subtitle && (
                          <span className="text-xs font-normal text-text-muted">{banner.subtitle}</span>
                        )}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-text-secondary">{banner.placementLabel}</TableCell>
                  <TableCell className="text-text-secondary">
                    {banner.linkType === "none" ? (
                      "—"
                    ) : (
                      <span className="flex flex-col">
                        {banner.linkTypeLabel}
                        <span className="break-all text-xs text-text-muted">{banner.linkValue}</span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-text-secondary">{banner.displayOrder}</TableCell>
                  <TableCell className="text-text-secondary">
                    {banner.startsAt || banner.endsAt
                      ? `${banner.startsAt ? formatDate(banner.startsAt) : "Always"} → ${
                          banner.endsAt ? formatDate(banner.endsAt) : "No end"
                        }`
                      : "Always"}
                  </TableCell>
                  <TableCell>
                    {/* is_live folds the schedule in, so an active-but-future
                        banner reads "Scheduled" rather than "Live". */}
                    <Badge meta={promoCodeStateMeta[bannerState(banner)]} />
                  </TableCell>
                  <TableCell>
                    <ActionMenu
                      items={[
                        { label: "Edit", onClick: () => setDialog({ kind: "form", banner }) },
                        {
                          label: banner.isActive ? "Deactivate" : "Activate",
                          icon: RefreshIcon,
                          onClick: async () => notify(await toggleBannerStatusAction(banner.id)),
                        },
                        {
                          label: "Delete",
                          icon: TrashIcon,
                          danger: true,
                          onClick: () => setDialog({ kind: "delete", banner }),
                        },
                      ]}
                    />
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </TableShell>

          <Pagination pagination={pagination} />
        </>
      )}

      {dialog?.kind === "form" && <BannerForm banner={dialog.banner} onClose={() => setDialog(null)} />}

      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title="Delete banner"
          description={`${dialog.banner.title} will be removed from the storefront immediately.`}
          confirmLabel="Delete"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={async () => {
            const result = await deleteBannerAction(dialog.banner.id);
            notifySuccess(result);
            if (result.ok) setDialog(null);
            return result;
          }}
        />
      )}
    </div>
  );
}

function BannerForm({ banner, onClose }: { banner: BannerRow | null; onClose: () => void }) {
  const [linkType, setLinkType] = useState<BannerLinkType>(banner?.linkType ?? "none");
  const { notifySuccess } = useToast();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    // Required on create, optional on update — dropping an empty file input
    // keeps the existing image rather than failing the `image` rule.
    const image = form.get("image");
    if (image instanceof File && image.size === 0) form.delete("image");

    form.set("is_active", form.get("is_active") !== null ? "1" : "0");

    // The backend rejects a link value when the type is "none", so it is
    // cleared here rather than relying on the field being hidden.
    if (linkType === "none") form.set("link_value", "");

    // Empty dates would fail the `date` rule; absent means "no bound".
    for (const key of ["starts_at", "ends_at"]) {
      if (String(form.get(key) ?? "").trim() === "") form.delete(key);
    }

    setPending(true);
    setMessage("");
    setErrors({});

    const result = await saveBannerAction(banner?.id ?? null, form);
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
      title={banner ? `Edit ${banner.title}` : "New banner"}
      submitLabel={banner ? "Save changes" : "Create banner"}
      pending={pending}
      message={message}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <Field label="Title" error={fieldError(errors, "title")}>
        <input name="title" required maxLength={255} defaultValue={banner?.title ?? ""} className={inputClass} />
      </Field>

      <Field label="Subtitle" error={fieldError(errors, "subtitle")}>
        <input name="subtitle" maxLength={255} defaultValue={banner?.subtitle ?? ""} className={inputClass} />
      </Field>

      <Field label="Description" error={fieldError(errors, "description")}>
        <textarea
          name="description"
          rows={3}
          maxLength={1000}
          defaultValue={banner?.description ?? ""}
          className={textareaClass}
        />
      </Field>

      <Field
        label={banner ? "Image" : "Image (required)"}
        error={fieldError(errors, "image")}
        hint={
          banner
            ? "JPEG, PNG, JPG or WEBP, up to 4 MB. Leave empty to keep the current image."
            : "JPEG, PNG, JPG or WEBP, up to 4 MB."
        }
      >
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          required={banner === null}
          className="w-full text-sm text-text-secondary file:mr-3 file:h-9 file:rounded-lg file:border-0 file:bg-surface-muted file:px-3 file:text-sm file:font-medium file:text-text-secondary"
        />
      </Field>

      <Field label="Placement" error={fieldError(errors, "placement")}>
        <select name="placement" defaultValue={banner?.placement ?? "home"} className={inputClass}>
          {BANNER_PLACEMENTS.map((placement) => (
            <option key={placement} value={placement}>
              {bannerPlacementLabels[placement]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Link type" error={fieldError(errors, "link_type")}>
        <select
          name="link_type"
          value={linkType}
          onChange={(event) => setLinkType(event.target.value as BannerLinkType)}
          className={inputClass}
        >
          {BANNER_LINK_TYPES.map((type) => (
            <option key={type} value={type}>
              {bannerLinkTypeLabels[type]}
            </option>
          ))}
        </select>
      </Field>

      {/* Hidden for "none": the backend refuses a value in that case. */}
      {linkType !== "none" && (
        <Field
          label="Link value"
          error={fieldError(errors, "link_value")}
          hint={bannerLinkValueHints[linkType]}
        >
          <input
            name="link_value"
            required
            maxLength={2048}
            defaultValue={banner?.linkValue ?? ""}
            className={inputClass}
          />
        </Field>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Starts" error={fieldError(errors, "starts_at")}>
          <input name="starts_at" type="date" defaultValue={toDateInput(banner?.startsAt ?? null)} className={inputClass} />
        </Field>
        <Field label="Ends" error={fieldError(errors, "ends_at")}>
          <input name="ends_at" type="date" defaultValue={toDateInput(banner?.endsAt ?? null)} className={inputClass} />
        </Field>
      </div>

      <Field label="Display order" error={fieldError(errors, "display_order")}>
        <input
          name="display_order"
          type="number"
          min={0}
          defaultValue={banner?.displayOrder ?? 0}
          className={inputClass}
        />
      </Field>

      <CheckboxField name="is_active" label="Active" defaultChecked={banner?.isActive ?? true} />
    </FormDialog>
  );
}
