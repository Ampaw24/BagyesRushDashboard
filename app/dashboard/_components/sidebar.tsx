import Image from "next/image";
import Link from "next/link";
import logo from "@/public/icon.jpeg";
import { LogoutIcon } from "../_lib/icons";
import { NavTree } from "./nav-tree";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-border-subtle bg-surface lg:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          <Image src={logo} alt="Bagyes Rush Delivery" width={40} height={40} className="h-full w-full object-contain" priority />
        </span>
        <span className="break-words text-sm font-semibold tracking-wide text-foreground">Bagyes Rush</span>
      </div>

      <NavTree />

      <div className="flex flex-col gap-1 border-t border-border-subtle px-3 py-4">
        <ThemeToggle variant="row" />
        <Link
          href="/login"
          className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted"
        >
          <LogoutIcon className="h-5 w-5 shrink-0" />
          Log out
        </Link>
      </div>
    </aside>
  );
}
