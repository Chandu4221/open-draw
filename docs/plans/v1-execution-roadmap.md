# OpenDraw v1 Execution Roadmap (Milestones 08–14)

- **Status:** Ratified
- **Date:** 2026-11-06
- **Branch:** `docs/milestone-roadmap-plans`
- **Applicable Rules:** R-002, R-004, R-005, R-006, R-008, R-009, R-010, R-014, R-015, R-016, R-018, R-019, R-020, R-023, R-026, R-027, R-030, R-032, R-033, R-034, R-035, R-036, R-040, R-043

This document is the binding single source of truth for the planned milestones following the initial standalone npm distribution of `@open-draw/canvas@0.7.0` (commit `c2d4e91`). It consolidates all findings from the Open Issues Report (Sections A through G), workflow enhancements, and new product features into 7 sequential milestones.

---

## Master Milestones Table

| #       | Milestone Title                                                   | Primary Scope                                                                                                                                                                                             | Target Branch                              | Rules Implemented                                                                                   |
| ------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **08**  | **Privacy, Cloudflare Deployment & Workflow Hygiene** (Merged)    | Migrate to Cloudflare Pages, harden CI/release workflows, add license notices, update README & npm metadata, enable private repo transition                                                               | `feat/cloudflare-pages-deployment`         | R-001, R-014, R-032, R-033, R-034, R-035, R-036                                                     |
| **09**  | **Engine Performance & Core Canvas Interaction** (Merged)         | $O(1)$ child index, cursor-based BFS, gesture render decoupling, negative drag-to-draw & resize flipping, double-click drill-down, R-019 named events                                                     | `feat/engine-performance-and-interaction`  | R-008, R-009, R-015, R-016, R-018, R-019                                                            |
| **10**  | **Studio Workbench & Resizable Inspector (`allotment`)** (Merged) | Resizable split-view via `allotment`, multi-select inspector, responsive controls polish, top-right toast repositioning, apps consolidation to `apps/studio`, Playwright smoke tests                      | `feat/studio-workbench-and-inspector`      | R-001, R-002, R-005, R-010, R-014, R-020, R-035                                                     |
| **11**  | **P0 Platform Semantics, Root Theming & AI Directives**           | Expanded P0 semantic catalogs (Web, Android, Flutter, iOS) split under 300 lines (R-010); root brand theme inputs; export popup with 4 AI directives (A11y, Contrast, Stack Detection, Codegen Style)     | `feat/semantics-theming-and-ai-directives` | R-006, R-010, R-016, R-023, R-026, R-040                                                            |
| **11A** | **Machine-Readable Export Parity** (Completed)                    | Chip ID system (`#s-xxxx`), pure JSON export projection, Markdown tree hierarchy & boxes, deterministic ASCII layout sketch, SVG annotations layer with dependency inversion, on-demand chip-keyed legend | `feat/export-shape-parity`                 | R-002, R-005, R-006, R-008, R-010, R-014, R-016, R-020, R-021, R-025, R-041, R-042, R-043, ADR-0010 |
| **12**  | **Studio UI Redesign & Floating Chrome (Inspector & Dock)**       | Redesign inspector into collapsible card widgets with 2-column inline inputs (`PX`, `%`) & segmented controls; refine floating dock into distinct tool/action/export pill groups; re-anchor collapse      | `feat/studio-ui-redesign-and-chrome`       | R-004, R-008, R-010, R-014, ADR-0007                                                                |
| **13**  | **Advanced Transformations**                                      | Shape rotation (`rotation` property, top rotation handle, un-rotated hit testing, SVG rotation) and shape skewing                                                                                         | `feat/shape-transformations`               | R-005, R-006, R-008, R-016, R-021                                                                   |
| **14**  | **Front Page Showcase (Golden Circle)**                           | OpenDraw marketing landing page (`/`), Simon Sinek Golden Circle copy, live SVG hero render via `@open-draw/renderer-svg`, 3–4 switchable CSS token packs                                                 | `feat/front-page-showcase`                 | R-004, R-010, R-014, R-021                                                                          |
| **—**   | **Responsive Reflow Add-on (Experimental)**                       | Dedicated `@open-draw/reflow` package: pure layout solver (`derive(doc, deviceType)`).                                                                                                                    | `feat/responsive-reflow-addon`             | R-002, R-004, R-016, R-027, R-030 (PARKED)                                                          |

---

## Detailed Milestone Specifications

### Milestone 08 — Privacy, Cloudflare Deployment & Workflow Hygiene

#### Objective

Enable the owner to make the GitHub repository private immediately without losing web hosting, resolve all npm metadata and licensing oversights, and harden GitHub Actions workflows.

#### Tasks

1. **Cloudflare Pages Migration:**
   - Update Vite build base command for Studio to root path (`--base=/`). Playground remains strictly an internal local/pre-prod development environment (`pnpm dev`) and is not deployed to production.
   - In `.github/workflows/release.yml`, replace GitHub Pages actions (`upload-pages-artifact`, `deploy-pages`) with `cloudflare/wrangler-action@v3` targeting `apps/studio/dist`.
   - Remove unused `permissions: pages: write` and update environment name from `github-pages` to `production`.
2. **Workflow Hardening & Cleanups:**
   - **`ci.yml`**: Eliminate redundant `lint:deps` and `lint:naming` invocations prior to `pnpm check`. Add a step validating PR titles against conventional commit syntax (R-033). Pin runner to `ubuntu-24.04`.
   - **`publish-npm.yml`**: Add version-tag matching check; require `environment: npm-release` approval gate; add concurrency controls; remove `--no-git-checks`.
   - Standardize all runner environments to `ubuntu-24.04`.
3. **npm Metadata & Documentation Alignment (Issues A1, A2, A7, A8):**
   - Add `repository`, `homepage`, `bugs`, `keywords`, and `sideEffects: false` to `packages/canvas/package.json`.
   - Update `README.md` and `docs/about/roadmap.md` to document `@open-draw/canvas@0.7.0` as live and clarify that internal packages (`semantics`, `profiles`, `export-markdown`, `ui`) remain strictly private.
4. **Third-Party License Attributions & Stale Docs (Issues G1, G2, G3, G4):**
   - Add `license-ofl.txt` (Inter font) and `license-apache.txt` (Material Symbols) to `packages/ui/` (R-014).
   - Update `README.md` to include iOS platform support.
   - Populate or remove empty placeholder files (`docs/architecture/overview.md`, `docs/contracts/document-model.md`).
   - Reconcile untracked local milestone drafts.
5. **Front-Facing Landing Page & Multi-Style Showcase (Dogfooding POC):**
   - In `apps/studio`, implement root view routing (`/` renders Landing Page, CTA button transitions to Studio workbench `/app`).
   - Single semantic HTML structure designed directly within OpenDraw.
   - Interactive design style switcher dropdown demonstrating 3 distinct visual themes (`minimalism`, `neo-brutalism`, `terminal-monospace`) using pure CSS variable stylesheets with **zero markup changes**.
   - Prominent "Launch Studio" CTA.

---

### Milestone 09 — Engine Performance & Core Canvas Interaction

#### Objective

Eliminate $O(N^2)$ traversal bottlenecks during rendering, hit testing, and export, while modernizing canvas interaction mechanics to match standard Figma paradigms.

#### Tasks

1. **Indexed Tree Traversal ($O(1)$ Child Lookups, Issues B1, B3):**
   - Build a cached parent-to-children index (`Map<ShapeId, ShapeId[]>`) inside `packages/document/src/tree.ts`.
   - Replace full-map filtering in `childrenOf()` with $O(1)$ map lookup.
   - Optimize `shapeListInOrder()` and `subtreeOf()` to use the indexed traversal.
   - Replace `queue.shift()` in `subtreeOf()` with a numeric index pointer to eliminate $O(M)$ array shifts.
   - Update `packages/canvas/src/hit-test.ts:pickShape()` to consume the indexed order.
2. **Render Loop Decoupling (Issue B2):**
   - Decouple transient pointer movements (drag preview, marquee, pan) from full document SVG re-serialization in `canvas-render.ts`.
   - Mutate transform and overlay SVG groups directly during active gestures rather than replacing `svg.innerHTML` on every pointer move event.
3. **Negative Drag-to-Draw & Bidirectional Resize Flipping:**
   - Update `packages/canvas/src/geometry.ts:resizeBox()` to remove the hard clamp ("no flip") and allow dragging past the opposite edge.
   - Automatically swap the active anchor handle (e.g. `nw` becomes `se`) when crossing the origin.
   - Normalize drawing gestures across parent container boundaries so dragging upward and to the left produces correct relative coordinates.
4. **Double-Click Selection Drill-Down (Idea 5):**
   - Enhance canvas gesture state machine and hit-test logic:
     - Single-click on a child selects the top-level root container (protecting group placement).
     - Double-click drills down selection into the direct child.
     - Subsequent double-clicks drill into nested grandchildren.
5. **Named Controller Events (Issue F5):**
   - Implement **R-019** typed event emitter API on `CanvasController`:
     - `subscribe(event: "documentChanged" | "selectionChanged" | "historyChanged", listener: () => void): () => void`

---

### Milestone 10 — Studio Workbench & Resizable Inspector (`allotment`)

#### Objective

Provide resizable split-view inspector panels via `allotment`, multi-selection batch alignment and styling, dynamic semantic property controls, responsive controls polish, top-right toast repositioning, application consolidation into `apps/studio`, and automated Playwright smoke testing.

#### Tasks

1. **Resizable Split-View via `allotment` (Issue E1):**
   - Install `allotment` in `apps/studio` and wrap canvas and sidebar in `<Allotment>`.
   - Restyle allotment sash with OpenDraw CSS tokens (`--od-border`, `--od-surface`).
   - Add snap-to-close behavior and sidebar collapse toggle.
2. **Multi-Select Inspector Panel (Issue E5):**
   - Track multi-selection state (`selectedShapeIds: readonly ShapeId[]`) from `canvasRef.current.getSelectedIds()`.
   - When multiple shapes are selected, render `MultiSelectInspector` providing:
     - Selected item count.
     - Batch alignment tools (Align Left, Center, Right, Top, Middle, Bottom).
     - Batch distribution tools (Distribute Horizontally, Vertically).
     - Batch styling (shared Fill, Stroke, Stroke Width).
     - Batch Delete action.
3. **Dynamic Semantic Property Controls:**
   - In `ComponentSemanticSection.tsx`, render data-driven controls dynamically for each property defined in `semanticDef.properties` (`text`, `select`, `toggle`, `number`).
4. **Inspector Layout & Label Polish (Issues E1, E3, C3):**
   - Redesign responsive controls to prevent horizontal clipping in the resizable sidebar.
   - Replace developer jargon labels ("Hidden On" → "Device Visibility", "Flex Order" → "Display Order") per R-039.
   - Replace visibility checkboxes with segmented icon toggle buttons.
5. **Toast Notifications Repositioning (Issue E2):**
   - In `packages/ui/src/base.css`, reposition `.od-toast-host` from `bottom: var(--od-24); left: 50%` to `top: var(--od-24); right: var(--od-24); flex-direction: column;`.
6. **Application Consolidation to `apps/studio` (Issue F1):**
   - Consolidate development and production into `apps/studio` as the single application, eliminating 31 duplicate files from legacy `apps/playground`.
7. **Playwright E2E Smoke Tests (Issue F4):**
   - Set up `playwright.config.ts` and author core smoke tests verifying canvas loading, shape creation, multi-select, and export modal rendering in Studio.
   - Wire smoke tests into the CI workflow per R-035.

---

### Milestone 11 — AI Prompt Directives, Semantics & Root Theming

#### Objective

Transform OpenDraw into an intelligent AI prompt compiler for design handoff, without bloating the engine with heavy internal calculation math.

#### Tasks

1. **A11Y & Color Contrast Directives (Idea 3):**
   - In `packages/export-markdown/src/export-markdown.ts`, inject a mandatory Accessibility & Contrast Directives section:
     - Enforce WCAG 2.1 AA 4.5:1 text-to-background contrast ratios.
     - Specify semantic ARIA landmarks, focus ring styling, and minimum 44x44px touch targets.
2. **Dark Mode Toggle & Embedded Switcher Directive (Idea 4):**
   - Add a Dark Mode switch to `apps/studio/src/components/ContainerInspector.tsx`.
   - _Unchecked (Default):_ AI prompt generates a clean single Light theme.
   - _Checked:_ AI prompt directives instruct generation of full dual Light/Dark themes and embed an interactive Theme Toggle Switch component in the generated navbar/header.
3. **Root Container Theme Palettes (Idea 6):**
   - Add semantic color palette slots (`primary`, `secondary`, `tertiary`, `surface`, `error`, `success`) to root shape metadata (R-026).
   - In `ContainerInspector.tsx`, add a theme palette picker.
   - Child shapes inherit theme tokens; export compiler outputs palette mappings for Tailwind CSS, Flutter `ThemeData`, and Android Compose.
4. **Semantic Specifics & Catalog Harmonization (Idea 2, Issues D1, D2, D3):**
   - Expand semantic definition properties in `packages/profiles`:
     - `heading`: H1–H6 levels.
     - `navbar`: `position: "static" | "fixed" | "docked"`.
   - Harmonize equivalent UI concept names across Web, Android, Flutter, and iOS.
   - Define clear cross-platform container migration rules.
5. **Scoped Root Device Lenses (Issues C1, C2):**
   - Scope `activeDeviceType` per root container shape in `createCanvas()` and `documentToSvg()`.

---

### Milestone 11A — Machine-Readable Export Parity

#### Objective

Guarantee machine-readable shape identity and semantics parity across all export formats (JSON, Markdown, SVG) via a shared chip ID system and pure export-time projections, with zero document mutation (R-016, R-025, ADR-0010).

#### Tasks

1. **Universal Chip ID System & Enriched JSON Export (Work Package A):**
   - Define `EXPORT_CHIP_PREFIX = "#"` in `@open-draw/contracts`.
   - Implement pure export projection `exportJson()` in `@open-draw/export-markdown`: top-level `shapeOrder`, `SEMANTICS_REGISTRY_VERSION`, chip IDs (`#s-xxxx`), explicit style fields (`fill`, `stroke`, `strokeWidth`), and explicit `semantic: null`.
   - Keep `@open-draw/document` untouched (R-016, R-025).
2. **Markdown Tree Hierarchy, Boxes & ASCII Layout Sketch (Work Package B):**
   - Replace flat bullets with indented tree hierarchy walking `subtreeOf` in canonical order.
   - Amend ADR-0005 D2 to include parent-relative bounding boxes `[x:0.00 y:0.00 w:0.00 h:0.00]`.
   - Implement deterministic 80-column ASCII layout sketch renderer auto-included when shape count $> 5$ (`ASCII_SKETCH_SHAPE_THRESHOLD = 5`).
3. **SVG Annotations Layer & Dependency Inversion (Work Package C):**
   - Add `data-shape-id`, `data-chip-id`, `data-semantic`, `data-parent-id`, `<title>`, and `role="img"`/`aria-label` to exported SVG shape groups.
   - Render top-level `<g class="annotation-chips">` overlay with deterministic collision avoidance.
   - Maintain strict package boundaries: `@open-draw/renderer-svg` never imports semantics or profiles; Studio injects `resolveDisplayName` resolver.
4. **On-Demand Chip-Keyed Legend & Studio UI Wiring:**
   - Remove legacy generic glossary legend across all formats; replace with on-demand chip-keyed mappings (`#s-7a01 — Profie Card (Card)`).
   - Wire legend, ASCII sketch, and annotations toggles in Studio `ExportModal`. Default legend to OFF.

---

### Milestone 12 — Studio UI Redesign & Floating Chrome (Inspector Layout & Dock Controls)

#### Objective

Overhaul Studio's visual chrome and inspector panels based on design references, introducing collapsible card sections, compact 2-column inline inputs (`PX`, `%`), segmented icon/pill controls, and a refined modular floating dock.

#### Tasks

1. **Redesign the Inspector Layout:**
   - Implement collapsible card widgets for logical property sections (`Identity`, `Geometry`, `Platform & Semantics`, `Styling` / `Fill & Stroke`, `Layout & Responsive`) with `—` / `+` collapse toggles and persistent open/close states.
   - Refactor geometry and spacing inputs into compact 2-column inline numeric pairs (Width / Height, X / Y) with embedded unit badges (`PX`, `%`, `auto`).
   - Replace full-width `<select>` dropdowns with segmented icon/pill controls for choices with $\le 4$ options (e.g. text alignment, stroke styles, device types).
   - Establish proportional spacing with $12\text{px}$–$16\text{px}$ card margins and $4\text{px}$–$6\text{px}$ inner element gaps.
2. **Refine Dock & Floating Controls:**
   - Partition the floating bottom dock into distinct functional pill groups:
     - Drawing Tools (Select, Pan, Rect, Ellipse, Line, Text, Container).
     - Canvas History & Actions (Undo, Redo, Zoom In, Zoom Out, Zoom Reset, Zoom to Fit).
     - File & Export (New, Open, Save, Export Markdown/SVG).
   - Apply surface elevation depth (`--od-surface-raised`), soft floating drop shadows (`box-shadow`), active state indicators, and polished dark/light mode balance.
   - Re-anchor the "Hide Inspector" toggle from empty canvas space into the workbench header or allotment sash to avoid floating clutter.

---

### Milestone 13 — Advanced Transformations

#### Objective

Provide vector editing capabilities for shape rotation and skewing.

#### Tasks

1. **Shape Rotation:**
   - Add `rotation?: number` (degrees, 0–360) to `BaseShape` in `packages/document/src/shape.ts`.
   - Implement typed `SetShapeRotation` command and transaction support.
   - In `packages/renderer-svg/src/document-to-svg.ts`, render `transform="rotate(${rotation} ${cx} ${cy})"`.
   - Add top circular rotation handle to selection overlays in `packages/renderer-svg/src/overlays/`.
   - In `packages/canvas/src/hit-test.ts`, un-rotate the pick point by `-${rotation}` around the shape center prior to box containment checks.
2. **Shape Skewing:**
   - Add `skewX?: number` and `skewY?: number` to `BaseShape`.
   - Implement SVG skew rendering and 2D affine transform matrix hit-testing.

---

### Milestone 14 — Front Page Showcase (Golden Circle)

#### Objective

Create the OpenDraw marketing landing page (`/`) implementing Simon Sinek's Golden Circle copy structure, live SVG hero rendering via `@open-draw/renderer-svg`, and 3–4 switchable CSS token packs.

#### Tasks

1. **Golden Circle Landing Copy & Structure:**
   - Why: Purpose-driven philosophy (pure vectors, AI-ready semantics, zero lock-in).
   - How: Lightweight standalone engine, clean package boundaries, determinism.
   - What: High-performance canvas SDK, semantic wireframing studio, AI prompt compiler.
2. **Live Interactive Hero:**
   - Render live SVG graphics using `@open-draw/renderer-svg` directly on the landing page.
   - Provide interactive CSS token pack switcher demonstrating real-time visual style changes.

---

### Milestone — Responsive Reflow Add-on (`@open-draw/reflow` Experimental)

#### Objective

Research, prototype, and validate a pure responsive layout solver on a dedicated experimental branch without destabilizing `main`.

#### Tasks

1. **Package & Branch Setup (Idea 1):**
   - Work on isolated feature branch `feat/responsive-reflow-addon`.
   - Create `@open-draw/reflow` package depending strictly on `contracts`, `document`, and `profiles` (no DOM, no canvas, no React).
2. **Pure Layout Solver Engine (R-030):**
   - Implement `solveResponsiveLayout(document: Document, rootId: ShapeId, deviceType: DeviceType): ResolvedLayout`.
   - Calculate responsive bounding boxes for Rows, Columns, and Auto-Wrap honoring `meta.order` and `meta.hiddenOn`.
   - Stored canonical document boxes are never mutated (R-016).
3. **Pure Unit-Test Suite & Studio Integration Gate:**
   - Build 100% test coverage asserting byte-stable layout solutions across mobile, tablet, and desktop viewports.
   - Wire layout solver into Studio's responsive preview lens.
   - Merge to `main` only after full owner review and verification.
