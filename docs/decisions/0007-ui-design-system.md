# ADR-0007 — UI Shell Design System & Shared Component Architecture

- **Status:** Accepted
- **Date:** 2026-11-04
- **Deciders:** Chandra (Owner), Antigravity Agent
- **Rules implemented:** R-002, R-004, R-005, R-008, R-010, R-014, R-018, R-020, R-034, R-036, R-038

---

## Context

OpenDraw previously had UI chrome in `apps/playground` that relied on ad-hoc inline styles, inconsistent font and color definitions, inline unicode symbols, and rule IDs displayed in inspector labels. Furthermore, `apps/studio` was a placeholder shell waiting to mount the full OpenDraw visual design environment.

To unify the visual identity and user interface across both products without compromising architectural boundaries or introducing runtime bloat, a dedicated UI design system package was required.

This ADR specifies the rulings, architecture, package boundaries, token specifications, icon registry, and component primitives forming the `@open-draw/ui` design system.

---

## Architectural Rulings

1. **Zero New Runtime Dependencies (R-002 Spirit at App Layer):**
   - The design system uses hand-rolled CSS custom properties (`tokens.css`, `base.css`).
   - No CSS-in-JS, Tailwind, component library, or external styling runtime.
   - Zero font files, CDN stylesheets, or webfont network requests.

2. **Inline SVG Icon Registry (R-005):**
   - Icons use Material Symbols glyph geometries stored strictly as SVG path data strings in a closed `as const` registry (`ICONS`).
   - Icon identifiers are strongly typed as `IconId = (typeof ICONS)[keyof typeof ICONS]`.
   - String literals outside this registry are forbidden.

3. **Strict Package Boundary (R-020):**
   - `@open-draw/ui` is a **private** package.
   - `@open-draw/ui` depends on **nothing** (only peer dependencies on React 19).
   - Core packages (`contracts`, `document`, `canvas`, `renderer-svg`, `semantics`, `shapes`, `profiles`, `export-markdown`, `input`) must **never** import `@open-draw/ui`.
   - Only `apps/*` (`apps/playground`, `apps/studio`) may import `@open-draw/ui`. Enforced via `.dependency-cruiser.cjs`.

4. **Modular & Composable Shell Architecture (R-004, R-034):**
   - `@open-draw/ui` provides un-opinionated primitives (`OdButton`, `OdIconButton`, `OdSegmentedControl`, `OdField`, `OdToastHost`).
   - Domain components (`Inspector`, `Toolbar`, `TreeOutline`) compose `@open-draw/document`, `@open-draw/semantics`, and `@open-draw/ui` at the app layer.
   - `apps/playground` functions as the rapid dev server with development experimentation.
   - `apps/studio` mounts the production wireframing layout (brand label "OpenDraw Studio", left tree outline, center canvas with dot grid, right inspector).

5. **Keyboard-First & Accessible (R-008, R-014):**
   - All interactive controls receive distinct `:focus-visible` styling with 2px accent outlines.
   - Tooltips are pure CSS via `[aria-describedby]::after` without JavaScript positioning recalculations.
   - All icon-only buttons require `aria-label`.

6. **Dark Mode via CSS Tokens:**
   - Both light and dark palettes are defined using CSS custom properties with `@media (prefers-color-scheme: dark)`.

---

## Design Tokens Specification (`tokens.css`)

All colors, spacing, borders, radii, and typography are centralized in `tokens.css`:

| Category       | Token                 | Light Value | Dark Value | Purpose                        |
| -------------- | --------------------- | ----------- | ---------- | ------------------------------ |
| Background     | `--od-bg`             | `#f4f4f5`   | `#09090b`  | App & canvas backdrop          |
| Surface        | `--od-surface`        | `#ffffff`   | `#141416`  | Panels, toolbars, sidebars     |
| Raised         | `--od-surface-raised` | `#ffffff`   | `#1c1c1f`  | Popovers, tooltips, toasts     |
| Border         | `--od-border`         | `#e4e4e7`   | `#27272a`  | Default panel/control border   |
| Border Strong  | `--od-border-strong`  | `#d4d4d8`   | `#3f3f46`  | Hovered/active borders         |
| Text Primary   | `--od-text`           | `#09090b`   | `#fafafa`  | Primary typography             |
| Text Secondary | `--od-text-secondary` | `#52525b`   | `#a1a1aa`  | Subdued text, icons, labels    |
| Text Tertiary  | `--od-text-tertiary`  | `#a1a1aa`   | `#71717a`  | Empty states, metadata, hints  |
| Accent         | `--od-accent`         | `#09090b`   | `#fafafa`  | Monochromatic brand accent     |
| Accent Soft    | `--od-accent-soft`    | `#e4e4e7`   | `#27272a`  | Active tool background tint    |
| Accent Border  | `--od-accent-border`  | `#09090b`   | `#fafafa`  | Active tool border stroke      |
| Text on Accent | `--od-text-on-accent` | `#ffffff`   | `#09090b`  | Text on primary buttons        |
| Semantic       | `--od-success`        | `#16a34a`   | `#22c55e`  | Success toasts                 |
| Semantic       | `--od-danger`         | `#dc2626`   | `#ef4444`  | Errors and destructive buttons |
| Semantic       | `--od-danger-soft`    | `#fef2f2`   | `#261416`  | Error toast background         |
| Radius         | `--od-radius-sm`      | `4px`       | `4px`      | Controls, inputs, buttons      |
| Radius         | `--od-radius`         | `6px`       | `6px`      | Panels, toasts                 |
| Typography     | `--od-text-sm`        | `12px`      | `12px`     | UI default size                |
| Typography     | `--od-text-xs`        | `11px`      | `11px`     | Metadata, shortcuts, tooltips  |

---

## Base CSS Classes (`base.css`)

All component classes use the prefix `od-` (R-014):

- `.od-panel`: Surface panel container with 1px border and subtle shadow.
- `.od-btn`: Text button with 28px height, padded inline, focus-visible ring; variants: default, `--primary`, `--ghost`, `--danger`.
- `.od-icon-btn`: 28×28px icon-only square button; variant: `--active`.
- `.od-divider`: 1px vertical or horizontal rule for separating toolbar action groups.
- `.od-segmented`: Joined pill segmented control with active segment highlighting.
- `.od-input`, `.od-select`: Standardized 28px controls matching panel token styling.
- `.od-label`: Uppercase tracking header style for inspector field labels.
- `.od-meta`: Monospace muted text for ShapeId and coordinates.
- `.od-empty`: Centered muted placeholder message.
- `.od-toast`: Fixed toast alerts with auto-dismiss timers.
- `.od-canvas-bg`: Dot grid underlay rendered entirely via CSS `radial-gradient` (R-016 determinism: canvas backdrop is chrome, not document data).

---

## Primitives in `@open-draw/ui`

1. **`<OdIcon name={IconId} />`**:
   - Renders 18×18 inline SVG path from the `ICONS` registry.
2. **`<OdButton variant size ...>`**:
   - Standard button supporting text + optional prefix/suffix icon.
3. **`<OdIconButton name aria-label active tooltip ...>`**:
   - Square icon button requiring accessible label and optional hover tooltip.
4. **`<OdSegmentedControl items value onSelect ...>`**:
   - Joined segment control used for tool selection, zoom presets, and device type switches.
5. **`<OdField label description ...>`**:
   - Labeled field container for form inputs in property inspectors.
6. **`OdToastProvider`, `useToast()`, `<OdToastHost />`**:
   - App-level toast alert system replacing inline status banners (R-018: toast state resides solely in application shell).

---

## Consequences

- Clean separation between core SDK packages and visual presentations.
- Both `apps/playground` and `apps/studio` share consistent styling, interaction states, and accessibility tokens.
- Zero extra bandwidth or bundle size overhead from third-party UI libraries.
- Future desktop or mobile shells can adopt the same design tokens and CSS base without architectural refactoring.
