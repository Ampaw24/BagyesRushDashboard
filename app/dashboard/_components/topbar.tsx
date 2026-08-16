import { AdminProfileMenu } from "./admin-profile-menu";
import { ThemeToggle } from "./theme-toggle";
import type { SessionAdmin } from "@/lib/mappers/admin-profile.mapper";

export function Topbar({ admin }: { admin: SessionAdmin }) {
  return (
    <header className="hidden items-center justify-end gap-3 border-b border-border-subtle bg-surface px-6 py-3 lg:flex">
      <ThemeToggle variant="icon" />
      <AdminProfileMenu id={admin.id} name={admin.name} roleLabel={admin.roleLabel} />
    </header>
  );
}
