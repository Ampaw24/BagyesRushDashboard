@AGENTS.md
# Project Rules

These rules apply to all UI, styling, and code contributed to this project — for humans and AI coding assistants alike.

## 1. Typography

- **Poppins is the only typeface used across the entire project.** No exceptions for headings, body text, buttons, forms, or code blocks.
- Load it via a proper font pipeline (e.g. `next/font/google`, self-hosted `.woff2` files) — never a runtime CDN `<link>` that can fail or flash unstyled text.
- Only load the weights actually used (typically 400, 500, 600, 700). Don't ship the full weight range.
- Icon fonts are not allowed — use an SVG icon set instead, so no second "font" sneaks in through an icon package.

## 2. Visual Design

- **No fancy effects.** This means: no gradients, no glassmorphism, no neumorphism, no animated backgrounds, no parallax, no particle effects.
- Shadows are limited to a single subtle elevation shadow, used sparingly (e.g. cards, modals). No multi-layer or colored shadows.
- Transitions are short and functional only — e.g. 150–200ms opacity/transform on hover, focus, or state change. Never motion for decoration.
- Keep the color palette flat and minimal: a small set of neutrals plus one or two brand/accent colors. Avoid neon or oversaturated colors.
- Borders, radii, and spacing should be defined once as design tokens (CSS variables / Tailwind theme config) and reused everywhere — no one-off values per component.

## 3. Responsiveness

- Build **mobile-first**, then progressively enhance for tablet and desktop.
- Use relative units (`rem`, `%`, `fr`, `clamp()`) instead of fixed pixel widths wherever layout needs to adapt.
- Every screen/component must be checked at minimum at: 375px (mobile), 768px (tablet), 1024px (small desktop), 1440px+ (large desktop).
- No horizontal scrolling at any breakpoint, except intentional horizontal scroll on data tables.
- Touch targets must be at least 44×44px on mobile.

## 4. Architecture — SOLID

Apply SOLID principles to components, hooks, and services:

- **Single Responsibility** — a component, hook, or module does one thing. Split data-fetching, data-transformation, and rendering into separate pieces rather than one component doing all three.
- **Open/Closed** — components should be extendable through props and composition (children, slots, render props) without editing their internals for every new use case.
- **Liskov Substitution** — any component implementing a shared contract (e.g. a `Button` variant, a form field) must be swappable for another implementation of that contract without breaking the consumer.
- **Interface Segregation** — keep prop interfaces and hook return types small and specific. Don't force a component to accept props it never uses; split large prop shapes into focused ones.
- **Dependency Inversion** — components depend on abstractions (a data hook, a service interface), not on concrete implementations (a specific API client, a specific state library). Inject dependencies via props, context, or hooks.

## 5. Suggested Structure

```
src/
  components/     # presentational, reusable UI only
  hooks/          # data-fetching and stateful logic
  services/       # API clients, external integrations (behind interfaces)
  lib/            # pure utility functions
  styles/         # design tokens (colors, spacing, radii, font weights)
```

## 6. Enforcement

- Lint rules (ESLint / Stylelint) should catch violations where possible — e.g. flag any `font-family` declaration that isn't Poppins.
- PR review checklist: font check, responsiveness check (all four breakpoints), no unnecessary animation/effects, SOLID adherence.