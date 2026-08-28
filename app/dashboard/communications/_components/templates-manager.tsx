"use client";

import { useState } from "react";

import { TableCell, TableHeadCell, TableShell } from "../../_components/table-shell";
import { ActionMenu, type ActionMenuItem } from "../../_components/action-menu";
import { ConfirmDialog } from "../../_components/confirm-dialog";
import { EmptyState } from "../../_components/empty-state";
import { formatDateTime } from "../../_lib/format";
import { createTemplateAction, deleteTemplateAction, updateTemplateAction } from "../_actions";
import type { CommunicationTemplateRow } from "@/lib/mappers/communication.mapper";
import {
  COMMUNICATION_CHANNELS,
  COMMUNICATION_CHANNEL_LABELS,
  type CommunicationChannel,
} from "@/lib/types/enums";

const FIELD =
  "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground outline-none transition duration-150 focus:border-brand";
const LABEL = "text-xs font-medium uppercase tracking-wide text-text-muted";

type Draft = {
  name: string;
  channel: CommunicationChannel;
  title: string;
  body: string;
  smsBody: string;
  isActive: boolean;
};

const EMPTY: Draft = {
  name: "",
  channel: "push",
  title: "",
  body: "",
  smsBody: "",
  isActive: true,
};

/**
 * Saved messages an admin can start a broadcast from.
 *
 * Templates are deleted outright rather than only deactivated, unlike the
 * reference tables: composing from one copies the text, so nothing links back
 * and removing one cannot orphan a communication.
 */
export function TemplatesManager({
  templates,
  canManage,
}: {
  templates: CommunicationTemplateRow[];
  canManage: boolean;
}) {
  const [editing, setEditing] = useState<CommunicationTemplateRow | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<CommunicationTemplateRow | null>(null);

  const open = (template: CommunicationTemplateRow | "new") => {
    setError("");
    setEditing(template);
    setDraft(
      template === "new"
        ? EMPTY
        : {
            name: template.name,
            channel: template.channel,
            title: template.title,
            body: template.body,
            smsBody: template.smsBody ?? "",
            isActive: template.isActive,
          },
    );
  };

  const save = async () => {
    setSaving(true);
    setError("");

    const input = {
      name: draft.name.trim(),
      channel: draft.channel,
      title: draft.title.trim(),
      body: draft.body.trim(),
      sms_body: draft.smsBody.trim() || null,
      is_active: draft.isActive,
    };

    const result =
      editing === "new"
        ? await createTemplateAction(input)
        : await updateTemplateAction((editing as CommunicationTemplateRow).id, input);

    setSaving(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => open("new")}
            className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
          >
            New template
          </button>
        </div>
      )}

      {templates.length === 0 ? (
        <EmptyState
          title="No templates"
          description="Save a message you send often and the composer can start from it."
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Channel</TableHeadCell>
              <TableHeadCell>Message</TableHeadCell>
              <TableHeadCell>Updated</TableHeadCell>
              <TableHeadCell>{""}</TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => {
              const actions: ActionMenuItem[] = canManage
                ? [
                    { label: "Edit", onClick: () => open(template) },
                    { label: "Delete", danger: true, onClick: () => setDeleting(template) },
                  ]
                : [];

              return (
                <tr key={template.id} className="transition duration-150 hover:bg-surface-muted">
                  <TableCell>
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">{template.name}</span>
                      {!template.isActive && (
                        <span className="text-xs text-text-muted">Inactive</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-text-secondary">{template.channelLabel}</span>
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-foreground">{template.title}</span>
                      <span className="line-clamp-1 text-xs text-text-muted">{template.body}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-text-secondary">{formatDateTime(template.updatedAt)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {actions.length > 0 && <ActionMenu items={actions} />}
                  </TableCell>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-xl border border-border-subtle bg-surface p-6 shadow-lg">
            <h2 className="text-base font-semibold text-foreground">
              {editing === "new" ? "New template" : "Edit template"}
            </h2>

            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Name</span>
              <input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                className={FIELD}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Channel</span>
              <select
                value={draft.channel}
                onChange={(event) =>
                  setDraft({ ...draft, channel: event.target.value as CommunicationChannel })
                }
                className={FIELD}
              >
                {COMMUNICATION_CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>
                    {COMMUNICATION_CHANNEL_LABELS[channel]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Title</span>
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                maxLength={120}
                className={FIELD}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Body</span>
              <textarea
                value={draft.body}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                rows={4}
                maxLength={1000}
                className="w-full rounded-lg border border-border-subtle bg-surface p-3 text-sm text-foreground outline-none transition duration-150 focus:border-brand"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>SMS text (optional)</span>
              <textarea
                value={draft.smsBody}
                onChange={(event) => setDraft({ ...draft, smsBody: event.target.value })}
                rows={2}
                maxLength={320}
                className="w-full rounded-lg border border-border-subtle bg-surface p-3 text-sm text-foreground outline-none transition duration-150 focus:border-brand"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
                className="h-4 w-4 rounded border-border-subtle"
              />
              Offer this in the composer
            </label>

            {error && <p className="text-xs text-status-critical">{error}</p>}

            <div className="flex items-center justify-end gap-2 border-t border-border-subtle pt-4">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || draft.name.trim() === "" || draft.body.trim() === ""}
                className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete "${deleting.name}"?`}
          description="Communications already composed from it are unaffected — the text was copied, not linked."
          confirmLabel="Delete"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            const result = await deleteTemplateAction(deleting.id);
            if (result.ok) setDeleting(null);

            return { ok: result.ok, message: result.message };
          }}
        />
      )}
    </div>
  );
}
