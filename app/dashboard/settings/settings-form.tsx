"use client";

import { useState, type FormEvent, type ReactNode } from "react";

type SaveStatus = "idle" | "saving" | "saved";

function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition duration-150 ${checked ? "bg-brand" : "bg-zinc-300 dark:bg-zinc-700"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-150 ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SettingsCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="break-words text-sm font-semibold text-foreground">{title}</h2>
        <p className="break-words text-sm text-text-muted">{description}</p>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <p className="break-words text-sm font-medium text-foreground">{label}</p>
        <p className="break-words text-xs text-text-muted">{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

export function SettingsForm() {
  const [platformName, setPlatformName] = useState("BagyesRUSH");
  const [supportEmail, setSupportEmail] = useState("support@bagyesrush.com");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("saving");
    await new Promise((resolve) => setTimeout(resolve, 700));
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <SettingsCard title="General" description="Basic details about your platform.">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="platformName" className="text-sm font-medium text-text-secondary">
            Platform name
          </label>
          <input
            id="platformName"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            className="h-11 w-full max-w-sm rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="supportEmail" className="text-sm font-medium text-text-secondary">
            Support email
          </label>
          <input
            id="supportEmail"
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            className="h-11 w-full max-w-sm rounded-lg border border-border-subtle bg-surface px-3.5 text-sm text-foreground outline-none transition duration-150 focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Notifications" description="Choose how the team hears about new activity.">
        <ToggleRow
          label="Email notifications"
          description="Order and rider alerts sent to admin email."
          checked={emailNotifications}
          onChange={() => setEmailNotifications((v) => !v)}
        />
        <ToggleRow
          label="SMS notifications"
          description="Critical alerts sent by text message."
          checked={smsNotifications}
          onChange={() => setSmsNotifications((v) => !v)}
        />
        <ToggleRow
          label="Push notifications"
          description="Browser push alerts for this dashboard."
          checked={pushNotifications}
          onChange={() => setPushNotifications((v) => !v)}
        />
      </SettingsCard>

      <SettingsCard title="Platform" description="Controls that affect every user right now.">
        <ToggleRow
          label="Maintenance mode"
          description="Temporarily pause new orders across the app."
          checked={maintenanceMode}
          onChange={() => setMaintenanceMode((v) => !v)}
        />
      </SettingsCard>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
        {status === "saved" && <span className="text-sm font-medium text-delta-good">Saved</span>}
      </div>
    </form>
  );
}
