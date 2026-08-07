"use client";

import { useTheme } from "../_hooks/use-theme";
import { MoonIcon, SunIcon } from "../_lib/icons";

type ThemeToggleProps = {
  variant?: "icon" | "row";
  className?: string;
};

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Dark theme" : "Light theme";
  const Icon = isDark ? SunIcon : MoonIcon;

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-pressed={isDark}
        className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-text-secondary transition duration-150 hover:bg-surface-muted ${className}`}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary transition duration-150 hover:bg-surface-muted ${className}`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
