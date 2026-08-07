import Image from "next/image";
import logo from "@/public/icon.jpeg";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

export function MobileTopbar() {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border-subtle bg-surface px-3 py-3 lg:hidden">
      <span className="flex items-center gap-2">
        <MobileNav />
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
            <Image src={logo} alt="Bagyes Rush Delivery" width={32} height={32} className="h-full w-full object-contain" priority />
          </span>
          <span className="text-sm font-semibold tracking-wide text-foreground">Bagyes Rush</span>
        </span>
      </span>

      <ThemeToggle />
    </header>
  );
}
