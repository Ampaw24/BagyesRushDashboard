import { AdminProfileMenu } from "./admin-profile-menu";
import { ThemeToggle } from "./theme-toggle";
import type { AdminRole } from "../_services/mock-data";

export function Topbar({ admin }: { admin: { id: string; name: string; role: AdminRole } }) {
  return (
    <header className="hidden items-center justify-end gap-3 border-b border-border-subtle bg-surface px-6 py-3 lg:flex">
      <ThemeToggle variant="icon" />
      <AdminProfileMenu id={admin.id} name={admin.name} role={admin.role} />
    </header>
  );
}
