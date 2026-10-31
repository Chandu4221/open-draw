# Roadmap — paste-ready

Paste this into `docs/about/roadmap.md` on branch `docs/roadmap` (R-032). Prettier-compliant as-is.

---

# OpenDraw Roadmap

The milestone order for the Canvas SDK + Studio. Status is updated at each milestone merge; scope details live in the plan docs under `docs/plans/`.

Status legend: ✅ done · 🚧 in progress · ⬜ not started

## Milestones

| #   | Milestone                     | Scope summary                                                                      | Status                 |
| --- | ----------------------------- | ---------------------------------------------------------------------------------- | ---------------------- |
| 1   | Workspace stabilization       | pnpm + Turbo workspace, per-package configs, CI/CD, Pages, LICENSE, rules          | ✅ v0.1.0 (2026-10-29) |
| 2   | Document model core           | Contracts, shape model, validation, commands, transactions, history (ADR-0002)     | ✅ (2026-10-30)        |
| 2b  | Minimal working canvas        | Camera, selection, tools, hit-test, SVG renderer, drag/move/resize in playground   | ✅ (2026-10-31)        |
| 3   | Document ops & SDK            | Serialization, input bindings, stable public API surface                           | ⬜ next                |
| 4   | Extension system              | Shape capabilities, custom renderers, plugin registration/validation/fallback      | ⬜                     |
| 5   | Semantic wireframing          | Semantic types, inspector schemas, hierarchy, platform/style profiles, inheritance | ⬜                     |
| 6   | Export & visual extensions    | Markdown handoff, overlays, crayon rendering, more adapters                        | ⬜                     |
| 7   | SDK stabilization & ecosystem | Publish, docs, versioning/migration policy, examples                               | ⬜                     |

## Milestone details

### 1 — Workspace stabilization (✅ v0.1.0)

Verify pnpm install, workspace discovery, scripts, TS config, lint, Studio build; add CI + architecture docs. First shippable release: empty Studio + playground shells deployed on Pages.

### 2 — Document model core (✅)

Flat normalized shape map, branded ids, discriminated shape union, boundary validation, typed commands registry, inverse transactions, history stacks (ADR-0002). Implemented in `@open-draw/contracts` + `@open-draw/document`.

### 2b — Minimal working canvas (✅)

`@open-draw/canvas` pure interaction core (camera as transform, selection, tool/handle/state/event registries, pure state machine, hit-test, geometry), `@open-draw/renderer-svg` pure renderer, playground imperative shell with pointer capture, one transaction per gesture.

### 3 — Document ops & SDK (next)

Serialize and load documents (JSON, version-only schema), input bindings mapped to named actions, and the stable public API surface of `@open-draw/canvas`. Serialization format and API surface are ruled in their plan doc before implementation begins.

### 4 — Extension system

Shape contract capabilities, custom renderer registration with validation and defined fallback, plugin namespacing/versioning with untrusted-by-default validation.

### 5 — Semantic wireframing

Semantic types with per-type inspector schemas, hierarchy semantics, labels vs derived display names, platform and style profiles as data modules, root-based inheritance.

### 6 — Export & visual extensions

Markdown semantic projection export, overlays, crayon/hand-drawn render styles with deterministic seeded variation, additional adapters.

### 7 — SDK stabilization & ecosystem

npm publish under `@open-draw/*`, documentation, versioning and migration policy, examples. `1.0.0` only when the SDK contract is stood behind (R-036).

## Changelog

- **2026-10-31** — Created. Milestones 1, 2, 2b complete; milestone 3 next.
