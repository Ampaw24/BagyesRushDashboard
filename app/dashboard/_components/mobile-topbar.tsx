import Image from "next/image";
import Link from "next/link";
import logo from "@/public/icon.jpeg";
import { LogoutIcon } from "../_lib/icons";

export function MobileTopbar() {
  return (
    <header className="flex items-center justify-between border-b border-border-subtle bg-surface px-4 py-3 lg:hidden">
      <span className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          <Image src={logo} alt="Bagyes Rush Delivery" width={32} height={32} className="h-full w-full object-contain" priority />
        </span>
        <span className="text-sm font-semibold tracking-wide text-foreground">Bagyes Rush</span>
      </span>

      <Link
        href="/login"
        aria-label="Log out"
        className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary transition duration-150 hover:bg-surface-muted"
      >
        <LogoutIcon className="h-5 w-5" />
      </Link>
    </header>
  );
}
