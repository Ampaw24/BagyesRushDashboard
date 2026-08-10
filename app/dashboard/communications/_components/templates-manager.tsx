"use client";

import { useState } from "react";
import Link from "next/link";
import { channelMeta, communicationTypeMeta } from "../../_lib/communications";
import { CopyIcon, PlusIcon } from "../../_lib/icons";
import { formatDate } from "../../_lib/format";
import { TemplateForm, type TemplateFormValues } from "./template-form";
import type { CommunicationTemplate } from "../../_services/communications-mock-data";

const EMPTY_TEMPLATE: TemplateFormValues = {
  name: "",
  type: "general",
  channels: [],
  title: "",
  message: "",
  ctaLabel: "",
  audienceRoles: [],
};

function nextId(templates: CommunicationTemplate[]): string {
  const max = templates.reduce((m, t) => Math.max(m, Number(t.id.replace("TPL-", "")) || 0), 100);
  return `TPL-${max + 1}`;
}

export function TemplatesManager({ initialTemplates }: { initialTemplates: CommunicationTemplate[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);

  const editingTemplate = editingId && editingId !== "new" ? templates.find((t) => t.id === editingId) : undefined;

  function handleSave(values: TemplateFormValues) {
    if (editingId && editingId !== "new") {
      setTemplates((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...values, updatedAt: new Date() } : t)));
    } else {
      const now = new Date();
      setTemplates((prev) => [{ ...values, id: nextId(prev), archived: false, createdAt: now, updatedAt: now }, ...prev]);
    }
    setEditingId(null);
  }

  function handleDuplicate(template: CommunicationTemplate) {
    const now = new Date();
    setTemplates((prev) => [
      { ...template, id: nextId(prev), name: `${template.name} (copy)`, createdAt: now, updatedAt: now },
      ...prev,
    ]);
  }

  function toggleArchive(id: string) {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, archived: !t.archived, updatedAt: new Date() } : t)));
  }

  if (editingId) {
    return (
      <TemplateForm
        initialValues={editingTemplate ?? EMPTY_TEMPLATE}
        onSubmit={handleSave}
        onCancel={() => setEditingId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditingId("new")}
          className="flex h-11 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
        >
          <PlusIcon className="h-4 w-4" />
          New template
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm ${template.archived ? "opacity-60" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <p className="break-words text-sm font-semibold text-foreground">{template.name}</p>
                <p className="text-xs text-text-muted">{communicationTypeMeta[template.type].label}</p>
              </div>
              {template.archived && (
                <span className="shrink-0 rounded-full bg-zinc-500/10 px-2 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">Archived</span>
              )}
            </div>

            <p className="break-words text-sm text-text-secondary">{template.message}</p>

            <div className="flex flex-wrap gap-1.5">
              {template.channels.map((channel) => (
                <span key={channel} className="rounded-full bg-surface-muted px-2 py-1 text-xs text-text-secondary">
                  {channelMeta[channel].label}
                </span>
              ))}
            </div>

            <p className="text-xs text-text-muted">Updated {formatDate(template.updatedAt)}</p>

            <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
              <Link
                href={`/dashboard/communications/new?type=${template.type}&template=${template.id}`}
                className="flex h-9 items-center rounded-lg bg-brand px-3 text-xs font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark"
              >
                Use template
              </Link>
              <button
                type="button"
                onClick={() => setEditingId(template.id)}
                className="flex h-9 items-center rounded-lg border border-border-subtle px-3 text-xs font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDuplicate(template)}
                className="flex h-9 items-center gap-1 rounded-lg border border-border-subtle px-3 text-xs font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
              >
                <CopyIcon className="h-3.5 w-3.5" />
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => toggleArchive(template.id)}
                className="flex h-9 items-center rounded-lg border border-border-subtle px-3 text-xs font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
              >
                {template.archived ? "Unarchive" : "Archive"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
