# OpenDraw Roadmap

The milestone order for the Canvas SDK + Studio. Status is updated at each milestone merge; scope details live in the plan docs under `docs/plans/`.

Status legend: ✅ done · 🚧 in progress · ⬜ not started

## Milestones

| #   | Milestone                     | Scope summary                                                                       | Status                                                  |
| --- | ----------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | Workspace stabilization       | pnpm + Turbo workspace, per-package configs, CI/CD, Pages, LICENSE, rules           | ✅ v0.1.0 (2026-10-29, commit 8aeb785)                  |
| 2   | Document model core           | Contracts, shape model, validation, commands, transactions, history (ADR-0002)      | ✅ (2026-10-30, commit 35f0582)                         |
| 2b  | Minimal working canvas        | Camera, selection, tools, hit-test, SVG renderer, drag/move/resize in playground    | ✅ (2026-10-31, commit c3dcdb6)                         |
| 3   | Document ops & SDK            | Serialization, input bindings, stable public API surface                            | ✅ (2026-10-31, commit d3385d4)                         |
| 4   | Extension system              | Shape capabilities, custom renderers, plugin registration/validation/fallback       | ✅ (2026-10-31, commit 5d22972)                         |
| 5   | Semantic wireframing          | Semantic types, inspector schemas, hierarchy, platform/style profiles, inheritance  | ✅ (2026-11-01, commit 15aa6e5)                         |
| 6   | Export & visual extensions    | Markdown handoff, overlays, crayon rendering, more adapters                         | ✅ (2026-11-01, commit 387d628)                         |
| 7   | SDK stabilization & ecosystem | Standalone canvas packaging, zero-dep bundle, dual ESM/CJS, public npm release      | ✅ @open-draw/canvas@0.7.0 (2026-11-05, commit c2d4e91) |
| 8   | Privacy & release hygiene     | Cloudflare Pages deploy, workflow hardening, license notices, npm metadata          | ⬜ not started (`docs/plans/v1-execution-roadmap.md`)   |
| 9   | Performance & core UX         | $O(1)$ child index, negative drag-to-draw/resize flip, double-click drill-down      | ⬜ not started (`docs/plans/v1-execution-roadmap.md`)   |
| 10  | Studio workbench & hygiene    | Multi-select inspector, layout overflow fixes, code deduplication, Playwright E2E   | ⬜ not started (`docs/plans/v1-execution-roadmap.md`)   |
| 11  | AI directives & root theming  | WCAG 2.1 AA prompt directives, Dark Mode switch + toggle, root color theme palettes | ⬜ not started (`docs/plans/v1-execution-roadmap.md`)   |
| 12  | Advanced transformations      | Shape rotation (handle, hit test, SVG transform) and shape skewing                  | ⬜ not started (`docs/plans/v1-execution-roadmap.md`)   |
| 13  | Responsive reflow add-on      | Experimental `@open-draw/reflow`: pure layout solver, rows/cols/order/wrap, tests   | ⬜ not started (`docs/plans/v1-execution-roadmap.md`)   |

## Milestone details

### 1 — Workspace stabilization (✅ v0.1.0)

Verify pnpm install, workspace discovery, scripts, TS config, lint, Studio build; add CI + architecture docs. First shippable release: empty Studio + playground shells deployed on Pages.

### 2 — Document model core (✅)

Flat normalized shape map, branded ids, discriminated shape union, boundary validation, typed commands registry, inverse transactions, history stacks (ADR-0002). Implemented in `@open-draw/contracts` + `@open-draw/document`.

### 2b — Minimal working canvas (✅)

`@open-draw/canvas` pure interaction core (camera as transform, selection, tool/handle/state/event registries, pure state machine, hit-test, geometry), `@open-draw/renderer-svg` pure renderer, playground imperative shell with pointer capture, one transaction per gesture.

### 3 — Document ops & SDK (✅ 2026-10-31, commit d3385d4)

Serialize and load documents (JSON, version-only schema), input bindings mapped to named actions, and the stable public API surface of `@open-draw/canvas`. Details in `docs/plans/milestone-03-document-ops-sdk.md`.

### 4 — Extension system (✅ 2026-10-31, commit 5d22972)

Shape contract capabilities, custom renderer registration with validation and defined fallback, plugin namespacing/versioning with untrusted-by-default validation. Details in `docs/plans/milestone-04-extension-system.md`.

### 5 — Semantic wireframing (✅ 2026-11-01, commit 15aa6e5)

Semantic types with per-type inspector schemas, hierarchy semantics, labels vs derived display names, platform and style profiles as data modules, root-based inheritance. Details in `docs/plans/milestone-05-semantic-wireframing.md`.

### 6 — Export & visual extensions (✅ 2026-11-01, commit 387d628)

Markdown semantic projection export, overlays, crayon/hand-drawn render styles with deterministic seeded variation, additional adapters. Details in `docs/plans/milestone-06-export-visual-extensions.md`.

### 7 — SDK stabilization & ecosystem (✅ 2026-11-05, commit c2d4e91)

Standalone packaging of `@open-draw/canvas` published to npm with zero runtime dependencies (R-002, ADR-0008), bundled dual ESM/CJS distribution, and rolled-up declaration types. Proprietary packages remain strictly private.

### 8 through 13 — Future Roadmap (⬜)

Full specifications, tasks, and target branches for Milestones 08 through 13 are documented in `docs/plans/v1-execution-roadmap.md`.

## Changelog

- **2026-11-06** — Ratified Milestones 08 through 13 in `docs/plans/v1-execution-roadmap.md`.
- **2026-11-05** — Milestone 7 shipped: `@open-draw/canvas@0.7.0` published to npm (commit `c2d4e91`, ADR-0008).
- **2026-11-02** — Milestone 7 stabilization in progress (`docs/plans/milestone-07-agent-instructions.md`).
- **2026-11-01** — Milestone 6 shipped (commit `387d628`, `docs/plans/milestone-06-export-visual-extensions.md`). Milestone 5 shipped (commit `15aa6e5`, `docs/plans/milestone-05-semantic-wireframing.md`).
- **2026-10-31** — Milestone 4 shipped (commit `5d22972`, `docs/plans/milestone-04-extension-system.md`). Milestone 3 shipped (commit `d3385d4`, `docs/plans/milestone-03-document-ops-sdk.md`).
- **2026-10-31** — Milestone 2b shipped (commit `c3dcdb6`, `docs/plans/milestone-02b-minimal-working-canvas.md`).
- **2026-10-30** — Milestone 2 shipped (commit `35f0582`, `docs/plans/milestone-02-document-core.md`).
- **2026-10-29** — Milestone 1 workspace stabilization shipped (commit `8aeb785`).
