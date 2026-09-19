import type { NavIconKey } from "./nav-items";

/**
 * The colour each top-level section is drawn in.
 *
 * Keyed on the section's icon key rather than its label, because the label is
 * copy and changes — "System Config – BAGYES" has already been renamed once —
 * while the icon key is the section's identity everywhere else in the tree.
 *
 * The values are CSS custom properties defined in `app/globals.css`, not hex
 * literals: each accent has a light and a dark value, and the tints for the
 * active and hover states are derived from it with `color-mix`. Putting the
 * colour here as a variable name keeps all four uses pointing at one token.
 */
const SECTION_ACCENTS: Partial<Record<NavIconKey, string>> = {
  overview: "--nav-overview",
  orders: "--nav-orders",
  riders: "--nav-riders",
  coupons: "--nav-coupons",
  transactions: "--nav-transactions",
  users: "--nav-users",
  support: "--nav-support",
  chat: "--nav-chat",
  communications: "--nav-communications",
  vendors: "--nav-vendors",
  catalogue: "--nav-catalogue",
  reviews: "--nav-reviews",
  administration: "--nav-administration",
  settings: "--nav-settings",
};

/**
 * `var(--nav-x)` for a section, falling back to the ordinary secondary text
 * colour.
 *
 * The fallback matters: sub-item glyphs share the `NavIconKey` union with
 * section glyphs, so a leaf icon like `clock` resolves here too and must come
 * out neutral rather than undefined.
 */
export function navAccent(icon: NavIconKey): string {
  const token = SECTION_ACCENTS[icon];
  return token ? `var(${token})` : "var(--text-secondary)";
}

/**
 * The accent, thinned to a background or border tint.
 *
 * `color-mix` rather than an opacity on the element, because the item has text
 * inside it — fading the whole box would fade the label with it.
 */
export function navTint(accent: string, percent: number): string {
  return `color-mix(in oklab, ${accent} ${percent}%, transparent)`;
}
