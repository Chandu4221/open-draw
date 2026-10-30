# ADR-0001 — Core Package Boundaries

- **Status:** Accepted
- **Date:** 2026-10-28
- **Supersedes:** none
- **Rules implemented:** R-001…R-004 (package boundary rules; see `docs/rules/opendraw-rules-md.md` for exact numbering)

## Context

OpenDraw ships two products from one workspace: the Canvas SDK (batteries-included,
framework-free) and Studio (the wireframing app). Many packages, apps, and future
plugins will share this repo. Before any code lands, the walls between packages must
be fixed — otherwise every later design decision degrades into "everything imports
everything", the exact failure mode that killed the previous project's architecture.

## Decision

### D1 — Document and Canvas are two different things

- **Document** = what exists: pure, JSON-serializable data that survives save and
  reload. "The .psd".
- **Canvas** = what you do with it: pointer input, camera, tools, selection,
  gestures. "The Photoshop app".
- **Placement test:** if it must survive save + reload, it belongs to the document;
  if not, it is canvas transient state.
- The canvas reads the document and mutates it **only** through typed commands. It
  never holds a second copy of truth; if the document changes (undo, plugin), the
  canvas re-renders from the new state.

### D2 — Dependency rules table (binding)

| Package         | May depend on           | Must NEVER depend on                |
| --------------- | ----------------------- | ----------------------------------- |
| `contracts`     | —                       | anything                            |
| `document`      | `contracts`             | React, SVG/DOM, Studio, canvas      |
| `canvas`        | `contracts`, `document` | semantics never mandatory           |
| `renderer`      | `contracts`, `document` | canonical state (document is truth) |
| `react` adapter | `canvas`                | reimplementing canvas internals     |
| `export`        | `contracts`, `document` | becoming a source of truth          |

- `contracts` sits at the bottom: types and registries only, zero dependencies.
- Every arrow points one way; there are no cycles, and the dep table is enforced
  mechanically in CI (ESLint `no-restricted-imports`, dependency-cruiser).

### D3 — Functional core, imperative shell

- Behavior lives in small, independent **pure functions** over plain typed data.
- A thin imperative shell owns side effects (DOM, events, storage) and calls the cores.
- State machines are pure `(state, event) → state` transition tables; commands are
  pure `(document, command) → result` functions.
- Shared context is an explicit first parameter — no globals, no singletons, no
  reach-ins. Cohesion guard: pure functions live in one module per subject; module
  edge = the only export boundary.

### D4 — Apps integrate; they do not implement

- `apps/studio` = the real product, published on GitHub Pages for public use.
- `apps/playground` = the development dogfood surface, exercising the SDK as it grows.
- Both apps are thin: they compose packages and never implement SDK behavior.

## Consequences

- The dep table plus the placement test is enough to resolve nearly every "where
  does this live?" question without debate.
- A plugin, new renderer, or new export format can never corrupt the core because
  it can only consume the documented package surfaces.
- `@open-draw/canvas` remains the primary public package; other packages publish
  only when a separate install has real value.
