import type { Metadata } from "next";
import { PageHeader } from "../_components/page-header";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "Settings — Bagyes Rush Delivery",
};

export default function SettingsPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="Settings" description="Manage general platform and notification preferences." />
      <SettingsForm />
    </div>
  );
}
