"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { channelMeta, communicationTypeMeta } from "../../_lib/communications";
import { ImageIcon } from "../../_lib/icons";
import type { AudienceRole, CommunicationChannel, CommunicationTemplate, CommunicationType } from "../../_services/communications-mock-data";

export type TemplateFormValues = Omit<CommunicationTemplate, "id" | "createdAt" | "updatedAt" | "archived">;

const TYPE_OPTIONS = Object.entries(communicationTypeMeta) as [CommunicationType, { label: string }][];
const CHANNEL_OPTIONS: CommunicationChannel[] = ["push", "email", "sms", "in_app"];
const ROLE_OPTIONS: AudienceRole[] = ["rider", "customer"];

function inputClass() {
  return "h-11 w-full rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10";
}

export function TemplateForm({
  initialValues,
  onSubmit,
  onCancel,
}: {
  initialValues: TemplateFormValues;
  onSubmit: (values: TemplateFormValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<TemplateFormValues>(initialValues);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setValues((prev) => ({ ...prev, imageUrl: reader.result as string }));
    reader.readAsDataURL(file);
  }

  function toggleChannel(channel: CommunicationChannel) {
    setValues((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel) ? prev.channels.filter((c) => c !== channel) : [...prev.channels, channel],
    }));
  }

  function toggleRole(role: AudienceRole) {
    setValues((prev) => ({
      ...prev,
      audienceRoles: prev.audienceRoles.includes(role) ? prev.audienceRoles.filter((r) => r !== role) : [...prev.audienceRoles, role],
    }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(values);
  }

  const isValid = values.name.trim() !== "" && values.title.trim() !== "" && values.message.trim() !== "" && values.channels.length > 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="template-name" className="text-sm font-medium text-text-secondary">
          Template name
        </label>
        <input
          id="template-name"
          value={values.name}
          onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
          className={inputClass()}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="template-type" className="text-sm font-medium text-text-secondary">
            Communication type
          </label>
          <select
            id="template-type"
            value={values.type}
            onChange={(e) => setValues((prev) => ({ ...prev, type: e.target.value as CommunicationType }))}
            className={inputClass()}
          >
            {TYPE_OPTIONS.map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="template-cta" className="text-sm font-medium text-text-secondary">
            CTA label <span className="text-text-muted">(optional)</span>
          </label>
          <input
            id="template-cta"
            value={values.ctaLabel ?? ""}
            onChange={(e) => setValues((prev) => ({ ...prev, ctaLabel: e.target.value }))}
            className={inputClass()}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-text-secondary">Default channels</p>
        <div className="flex flex-wrap gap-2">
          {CHANNEL_OPTIONS.map((channel) => (
            <label
              key={channel}
              className={`flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs font-medium transition duration-150 ${
                values.channels.includes(channel) ? "border-brand bg-brand/10 text-brand" : "border-border-subtle text-text-secondary"
              }`}
            >
              <input type="checkbox" checked={values.channels.includes(channel)} onChange={() => toggleChannel(channel)} className="sr-only" />
              {channelMeta[channel].label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-text-secondary">Target audience</p>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((role) => (
            <label
              key={role}
              className={`flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs font-medium capitalize transition duration-150 ${
                values.audienceRoles.includes(role) ? "border-brand bg-brand/10 text-brand" : "border-border-subtle text-text-secondary"
              }`}
            >
              <input type="checkbox" checked={values.audienceRoles.includes(role)} onChange={() => toggleRole(role)} className="sr-only" />
              {role}s
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="template-title" className="text-sm font-medium text-text-secondary">
          Title
        </label>
        <input
          id="template-title"
          value={values.title}
          onChange={(e) => setValues((prev) => ({ ...prev, title: e.target.value }))}
          className={inputClass()}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="template-message" className="text-sm font-medium text-text-secondary">
          Message
        </label>
        <textarea
          id="template-message"
          value={values.message}
          onChange={(e) => setValues((prev) => ({ ...prev, message: e.target.value }))}
          rows={3}
          placeholder="Hi {{first_name}}, ..."
          className="w-full resize-y rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-text-secondary">Image</p>
        {values.imageUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- previews an uploaded data URL, which next/image can't optimize */}
            <img src={values.imageUrl} alt="" className="h-16 w-16 rounded-lg border border-border-subtle object-cover" />
            <button
              type="button"
              onClick={() => setValues((prev) => ({ ...prev, imageUrl: undefined }))}
              className="flex h-9 items-center rounded-lg border border-border-subtle px-3 text-xs font-medium text-status-critical transition duration-150 hover:bg-surface-muted"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-20 w-full max-w-xs items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-subtle text-text-muted transition duration-150 hover:bg-surface-muted"
          >
            <ImageIcon className="h-5 w-5" />
            <span className="text-xs font-medium">Upload image</span>
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-11 items-center rounded-lg border border-border-subtle px-5 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid}
          className="flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          Save template
        </button>
      </div>
    </form>
  );
}
