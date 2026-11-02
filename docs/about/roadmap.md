# OpenDraw Roadmap

The milestone order for the Canvas SDK + Studio. Status is updated at each milestone merge; scope details live in the plan docs under `docs/plans/`.

Status legend: ✅ done · 🚧 in progress · ⬜ not started

## Milestones

| #   | Milestone                     | Scope summary                                                                      | Status                                                         |
| --- | ----------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | Workspace stabilization       | pnpm + Turbo workspace, per-package configs, CI/CD, Pages, LICENSE, rules          | ✅ v0.1.0 (2026-10-29, commit 8aeb785)                         |
| 2   | Document model core           | Contracts, shape model, validation, commands, transactions, history (ADR-0002)     | ✅ (2026-10-30, commit 35f0582)                                |
| 2b  | Minimal working canvas        | Camera, selection, tools, hit-test, SVG renderer, drag/move/resize in playground   | ✅ (2026-10-31, commit c3dcdb6)                                |
| 3   | Document ops & SDK            | Serialization, input bindings, stable public API surface                           | ✅ (2026-10-31, commit d3385d4)                                |
| 4   | Extension system              | Shape capabilities, custom renderers, plugin registration/validation/fallback      | ✅ (2026-10-31, commit 5d22972)                                |
| 5   | Semantic wireframing          | Semantic types, inspector schemas, hierarchy, platform/style profiles, inheritance | ✅ (2026-11-01, commit 15aa6e5)                                |
| 6   | Export & visual extensions    | Markdown handoff, overlays, crayon rendering, more adapters                        | ✅ (2026-11-01, commit 387d628)                                |
| 7   | SDK stabilization & ecosystem | Publish, docs, versioning/migration policy, examples                               | 🚧 in progress (docs/plans/milestone-07-agent-instructions.md) |

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

### 7 — SDK stabilization & ecosystem (🚧 in progress)

npm publish under `@open-draw/*`, documentation, versioning and migration policy, examples. `1.0.0` only when the SDK contract is stood behind (R-036). Details in `docs/plans/milestone-07-agent-instructions.md`.

## Changelog

- **2026-11-02** — Milestone 7 stabilization in progress (`docs/plans/milestone-07-agent-instructions.md`).
- **2026-11-01** — Milestone 6 shipped (commit `387d628`, `docs/plans/milestone-06-export-visual-extensions.md`). Milestone 5 shipped (commit `15aa6e5`, `docs/plans/milestone-05-semantic-wireframing.md`).
- **2026-10-31** — Milestone 4 shipped (commit `5d22972`, `docs/plans/milestone-04-extension-system.md`). Milestone 3 shipped (commit `d3385d4`, `docs/plans/milestone-03-document-ops-sdk.md`).
- **2026-10-31** — Milestone 2b shipped (commit `c3dcdb6`, `docs/plans/milestone-02b-minimal-working-canvas.md`).
- **2026-10-30** — Milestone 2 shipped (commit `35f0582`, `docs/plans/milestone-02-document-core.md`).
- **2026-10-29** — Milestone 1 workspace stabilization shipped (commit `8aeb785`).
