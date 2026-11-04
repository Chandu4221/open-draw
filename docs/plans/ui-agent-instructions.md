# UI Build Instructions (target: `docs/plans/ui-agent-instructions.md`, rides in `feat/ui-design-system` PR)

Implements the UI polish plan. Quote your rule in every commit. Zero changes to document/canvas/semantics/renderer cores.

## Rulings (locked, Chandra Nov 3)

- **Styling:** hand-rolled CSS design tokens, ZERO new runtime dependencies (implements R-002 spirit at app layer, R-005 one-place-then-typed).
- **Icons:** Material Symbols names as visual source, **inline SVG components — NO font, NO CDN, no dependency.**
- **Direction:** minimal pro (Figma/Linear-like): dense, neutral, keyboard-first.
- **Scope:** BOTH playground and Studio; NEW shared package `@open-draw/ui`.
- **Dark mode:** light + dark both, via `prefers-color-scheme` (CSS-only, no toggle state this round).

## Package: `@open-draw/ui` (new, PRIVATE — never publish)

Dependencies: NONE (peer: react only, for the few TSX primitives). Nothing may import ui except `apps/*`. ui imports NOTHING.

```
packages/ui/
  package.json            (name @open-draw/ui, private, exports "./tokens.css", "./base.css", src)
  tsconfig.json           (strip DOM types NOT needed — this package owns DOM rendering; mirror canvas shell rules)
  src/
    index.ts              (re-export everything public; R-010 frozen surface)
    tokens.css            (all CSS custom properties, light + dark)
    base.css              (element + component classes, od- prefix)
    icons/
      icons.ts            (ICONS registry: as-const, iconId → svg path data; IconId = value union)
      icon.tsx            (<OdIcon name={IconId} /> — renders inline <svg>)
    button.tsx            (<OdButton> text button; variants: primary | ghost; <OdIconButton> square icon-only, requires aria-label)
    tooltip.tsx            (pure CSS tooltip via aria-describedby + ::after — no JS positioning this round)
    segmented-control.tsx  (<OdSegmentedControl items onSelect> — for device types, zoom presets)
    field.tsx             (<OdField label> — labeled control wrapper for inspector rows)
    toast.tsx             (OdToastType registry, useToast hook + <OdToastHost> — bottom-center, auto-dismiss 3000ms)
```

**Update `.dependency-cruiser.cjs` (R-020):** `ui` depends on nothing; `apps/playground` and `apps/studio` may dep `ui`; NOTHING else may dep `ui`.

### tokens.css — full spec (copy exactly, extend as needed)

```css
:root {
  color-scheme: light dark;

  /* Neutral scale (light values) */
  --od-bg: #f8fafc; /* canvas backdrop / app bg */
  --od-surface: #ffffff; /* panels, toolbar, sidebar */
  --od-surface-raised: #ffffff;
  --od-border: #e2e8f0;
  --od-border-strong: #cbd5e1;
  --od-text: #0f172a;
  --od-text-secondary: #475569;
  --od-text-tertiary: #94a3b8;

  /* Accent — single accent only */
  --od-accent: #2563eb;
  --od-accent-soft: #eff6ff; /* active-tool tint */
  --od-accent-border: #93c5fd;

  /* Semantic */
  --od-success: #16a34a;
  --od-danger: #dc2626;
  --od-danger-soft: #fef2f2;

  /* Spacing scale */
  --od-2: 2px;
  --od-4: 4px;
  --od-8: 8px;
  --od-12: 12px;
  --od-16: 16px;
  --od-24: 24px;

  /* Radii + strokes */
  --od-radius-sm: 4px;
  --od-radius: 6px;
  --od-shadow: 0 1px 2px rgb(15 23 42 / 0.06), 0 4px 12px rgb(15 23 42 / 0.08);

  /* Type */
  --od-font: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --od-font-mono: ui-monospace, "SF Mono", Menlo, monospace;
  --od-text-sm: 12px; /* UI default */
  --od-text-xs: 11px; /* meta, shortcuts, tooltips */
}
@media (prefers-color-scheme: dark) {
  :root {
    --od-bg: #111418;
    --od-surface: #1a1f26;
    --od-surface-raised: #212730;
    --od-border: #2a3038;
    --od-border-strong: #3d4652;
    --od-text: #e6e9ed;
    --od-text-secondary: #9aa3ad;
    --od-text-tertiary: #5d6670;
    --od-accent: #3b82f6;
    --od-accent-soft: #16233a;
    --od-accent-border: #1d4ed8;
    --od-danger: #ef4444;
    --od-danger-soft: #2a1518;
    --od-shadow: 0 1px 2px rgb(0 0 0 / 0.4), 0 4px 12px rgb(0 0 0 / 0.5);
  }
}
```

### base.css — component classes (all selectors use tokens; NO hex/px outside tokens.css)

- `.od-panel` — surface, 1px border(--od-border), radius, shadow; used by toolbar/sidebar/inspector.
- `.od-btn` — height 28px, padding 0 10px, radius-sm, font-size --od-text-sm, border 1px --od-border, bg --od-surface, color --od-text-secondary; `:hover` → border-strong + text; `:active` → accent-soft bg; `:focus-visible` → 2px outline accent offset 1px (EVERY interactive class gets focus-visible — keyboard-first ruling).
- `.od-btn--primary` — accent bg, white text.
- `.od-icon-btn` — 28×28 square, centered icon; `--active` modifier = accent-soft bg + accent-border border.
- `.od-divider` — 1px × 16px, bg --od-border, margin-inline --od-8.
- `.od-segmented` / `.od-segmented__item` — joined controls: item border-right only, active item = accent-soft + accent-border, radius on ends only.
- `.od-input`, `.od-select` — height 28px, border, radius-sm, bg surface; focus-visible ring.
- `.od-label` — --od-text-xs, --od-text-secondary, uppercase tracking 0.04em (field labels only).
- `.od-meta` — --od-text-xs, --od-text-tertiary, font-mono (ShapeId display).
- `.od-tooltip-host[aria-describedby]::after` — pointer-events none, surface-raised bg, xs text, radius-sm, shadow, position absolute top 120%.
- `.od-toast` — bottom-center fixed stack, surface, border, shadow, radius; `.od-toast--success` left border 2px --od-success; `.od-toast--error` left border 2px --od-danger + danger-soft tint.
- `.od-empty` — centered tertiary text, padding --od-24.
- Canvas underlay: `.od-canvas-bg` — dot grid via `radial-gradient(circle, var(--od-border-strong) 1px, transparent 1px)` at 16px grid, bg --od-bg.

### icons.ts — registry pattern

Material Symbols glyph geometry as path data. CLOSED registry, `as const`, kebab-case values (R-005/R-013/R-014):

```
export const ICONS = {
  "select-tool": "...",       // near-cursor arrow (Material: "near_me" / custom arrow)
  "rect-tool": "...",         // check_box_outline_blank
  "ellipse-tool": "...",      // circle (outline)
  "line-tool": "...",         // straighten / custom diagonal
  "pen-tool": "...",          // gesture / edit
  "board-tool": "...",        // crop_landscape / web_asset
  save: "...",                // save
  open: "...",                // folder_open
  export: "...",              // download
  delete: "...",              // delete
  duplicate: "...",           // content_copy
  paste: "...",               // content_paste
  undo: "...",                // undo
  redo: "...",                // redo
  "zoom-in": "...",           // zoom_in
  "zoom-out": "...",          // zoom_out
  "fit-all": "...",           // fit_screen
  smartphone: "...", tablet: "...", laptop: "...", desktop: "...", monitor: "...",  // device types (reuse for device chips)
  chevron: "...",             // chevron_right (tree outline)
  close: "...",               // close
  help: "...",                // help — keyboard shortcut overlay trigger
  panel: "...",               // view_sidebar
} as const;
export type IconId = (typeof ICONS)[keyof typeof ICONS];
```

Rule: icon IDs never appear inline in apps — apps reference typed `IconId` values from the registry. Device-type icons map from `DEVICE_TYPES` values.

## App migration: `apps/playground`

1. **Delete all inline `style={{}}` colors/spacing** from App.tsx + components; replace with `od-` classes + tokens. (Copy + a11y props stay in TSX; only styling moves.)
2. **Import order** in main.tsx: `import "@open-draw/ui/tokens.css"; import "@open-draw/ui/base.css";` before index.css.
3. **Toolbar.tsx** — restructure into groups (same handlers, no logic change):
   - Group 1 (tools): `OdIconButton` for select/rect/ellipse/line/pen/board; active tool = `--active` variant; tooltip shows "Select (V)" style label.
   - `OdDivider` between groups.
   - Group 2 (document): Save, Load, Export as `OdButton`.
   - Group 3 (edit): undo, redo, duplicate, paste as `OdIconButton`.
   - Group 4 (zoom): `OdSegmentedControl` [zoom-out | percent | zoom-in | fit-all].
   - Group 5 (view): device `OdSegmentedControl` (icon-only, from DEVICE_TYPES), sidebar toggle, overlay toggle `OdIconButton`.
4. **Status text → toast:** replace `[message]` rendering with `useToast().push({ type, text })`; mount `<OdToastHost />` once in App.
5. **Inspector.tsx / ShapeInspector.tsx / ContainerInspector.tsx / ShapeStyleInspector.tsx**:
   - Wrap rows in `OdField` (label + control).
   - Strip rule numbers ("(R-042)" etc.) from labels — rules live in docs, not UI.
   - ShapeId: single `.od-meta` line with duplicate-on-click, not prominent.
   - Section the panels: IDENTITY / SEMANTIC / STYLE / RESPONSIVE headers (`.od-label`), collapsible optional.
6. **Empty states:** nothing-selected sidebar → `.od-empty` "Select a shape to inspect"; empty document → floating hint chip `.od-empty` "R rect · O ellipse · L line · P pen — wheel to pan".
7. **Canvas:** apply `od-canvas-bg` to the SVG container (CSS underlay only; renderer-svg untouched — grid is NOT document data, R-016).

## Studio: `apps/studio` — full shared shell

Same chrome architecture as playground (apps integrate, not implement — R-034):

1. **Layout:** top toolbar + left sidebar (tree outline) + right sidebar (inspector) + canvas center. Same `od-` classes, same primitives.
2. **Toolbar:** identical groups as playground; brand label "OpenDraw Studio" (`.od-label`) at far left. No fake features: only wire actions that exist (save/load/export/undo/redo/tools/device).
3. **Sidebar left:** TreeOutline component (extract playground's into shared code or duplicate minimally; prefer importing from a shared `@open-draw/ui` export only if trivially presentable — otherwise duplicate the component in studio and mark TODO consolidate).
4. **Right sidebar:** mount the same Inspector flow playground uses.
5. **Canvas init:** reuse playground's canvas-init/canvas-gestures wiring (studio package.json deps on the same @open-draw/* packages).
6. Studio ≠ copy-paste of playground internals: studio consumes PUBLIC package roots only (R-010 — no deep /src/ imports).

## Constraints (quote in PR + commits)

- R-004 (two products one rule), R-005 (closed registries — ICONS), R-008 (shell owns DOM; cores untouched), R-010 (frozen public surfaces; no /src/ imports), R-014 (kebab-case files, od- class prefix, kebab-case icon values), R-018 (no new reactive machinery — toasts are shell state), R-020 (dep rules in .dependency-cruiser.cjs), R-032 (branch name), R-036 (ui package surface frozen once shipped).
- ADR-0007 (UI shell design system) must land in `docs/decisions/0007-ui-design-system.md` in this PR: rulings above + token table + package boundaries.
- ZERO new npm dependencies. ZERO core package changes. All colors/spacing/radii via tokens — CI check idea (later): grep for `#[0-9a-f]{3,6}` outside tokens.css.

## Verification (all must pass)

```
pnpm install
pnpm check            # format → lint → lint:deps → lint:naming → typecheck → test → build
pnpm dev              # playground hand-test
```

Hand-test gate (R-043): draw each tool, select/move/resize, multi-select, marquee, reparent drag, undo/redo, duplicate/paste (hierarchy preserved), wheel pan, ctrl+wheel zoom, device switch + ghost render, save/load round-trip, markdown + PNG export, toast appears on save/export/load-error, toolbar full keyboard tab-through with visible focus, dark mode (OS switch) across every panel, Studio shell loads with same actions.

## Commit map (conventional, one concern each)

```
feat(ui): add @open-draw/ui design system package (tokens, base, icons, primitives)
feat(ui): icon registry with inline SVG Material glyphs (implements R-005)
feat(playground): migrate shell chrome to @open-draw/ui (implements R-004, R-008)
feat(playground): toolbar regrouping and segmented controls
feat(playground): toast system replaces inline status text
feat(playground): inspector sectioning and empty states
feat(studio): full shared shell using @open-draw/ui (implements R-034)
docs(decisions): ADR-0007 UI design system (implements R-038)
```
