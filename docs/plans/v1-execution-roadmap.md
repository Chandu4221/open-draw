# OpenDraw v1 Execution Roadmap (Milestones 08–13)

- **Status:** Ratified
- **Date:** 2026-11-06
- **Branch:** `docs/milestone-roadmap-plans`
- **Applicable Rules:** R-002, R-004, R-005, R-006, R-008, R-009, R-010, R-014, R-015, R-016, R-018, R-019, R-020, R-023, R-026, R-027, R-030, R-032, R-033, R-034, R-035, R-036, R-040, R-043

This document is the binding single source of truth for the planned milestones following the initial standalone npm distribution of `@open-draw/canvas@0.7.0` (commit `c2d4e91`). It consolidates all findings from the Open Issues Report (Sections A through G), workflow enhancements, and new product features into 6 sequential milestones.

---

## Master Milestones Table

| #      | Milestone Title                                          | Primary Scope                                                                                                                                                                                         | Target Branch                              | Rules Implemented                               |
| ------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| **08** | **Privacy, Cloudflare Deployment & Workflow Hygiene**    | Migrate to Cloudflare Pages, harden CI/release workflows, add license notices, update README & npm metadata, enable private repo transition                                                           | `feat/cloudflare-pages-deployment`         | R-001, R-014, R-032, R-033, R-034, R-035, R-036 |
| **09** | **Engine Performance & Core Canvas Interaction**         | $O(1)$ child index, cursor-based BFS, gesture render decoupling, negative drag-to-draw & resize flipping, double-click drill-down, R-019 named events                                                 | `feat/engine-performance-and-interaction`  | R-008, R-009, R-015, R-016, R-018, R-019        |
| **10** | **Studio Workbench & Resizable Inspector (`allotment`)** | Resizable split-view via `allotment`, multi-select inspector, responsive controls polish, top-right toast repositioning, apps consolidation to `apps/studio`, Playwright smoke tests                  | `feat/studio-workbench-and-inspector`      | R-001, R-002, R-005, R-010, R-014, R-020, R-035 |
| **11** | **P0 Platform Semantics, Root Theming & AI Directives**  | Expanded P0 semantic catalogs (Web, Android, Flutter, iOS) split under 300 lines (R-010); root brand theme inputs; export popup with 4 AI directives (A11y, Contrast, Stack Detection, Codegen Style) | `feat/semantics-theming-and-ai-directives` | R-006, R-010, R-016, R-023, R-026, R-040        |
| **12** | **Front Page Showcase (Golden Circle)**                  | OpenDraw marketing landing page (`/`), Simon Sinek Golden Circle copy, live SVG hero render via `@open-draw/renderer-svg`, 3–4 switchable CSS token packs                                             | `feat/front-page-showcase`                 | R-004, R-010, R-014, R-021                      |
| **13** | **Advanced Transformations**                             | Shape rotation (`rotation` property, top rotation handle, un-rotated hit testing, SVG rotation) and shape skewing                                                                                     | `feat/shape-transformations`               | R-005, R-006, R-008, R-016, R-021               |
| **—**  | **Responsive Reflow Add-on (Experimental)**              | Dedicated `@open-draw/reflow` package: pure layout solver (`derive(doc, deviceType)`).                                                                                                                | `feat/responsive-reflow-addon`             | R-002, R-004, R-016, R-027, R-030 (PARKED)      |

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

### Milestone 12 — Advanced Transformations

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

### Milestone 13 — Responsive Reflow Add-on (`@open-draw/reflow` Experimental)

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
