# Milestone 3 — Agent execution instructions

**Place at:** `docs/plans/milestone-03-agent-instructions.md` — commit it under version control on branch `feat/document-ops-sdk` (per the standing ruling from milestone 02b: agent instructions live in `docs/plans/`, checked in, never gitignored). It rides in the same PR as the implementation.

---

# Milestone 3 Agent Instructions — Document ops & SDK

You are implementing milestone 3 of the OpenDraw roadmap. You are an executor, not a decision-maker: every judgment below is already ruled (R-043). If you find something not covered here or by the rules, STOP and log it in `docs/od-questions.md` — never invent (R-038).

Read `docs/rules/RULES.md` first. Quote the rule you are implementing in each commit message body (review gate).

## Rulings in force (do not re-open)

1. **Serialization entry shape:** `{ "schema": { "version": 1 }, "shapes": { ... } }` — the shapes map ONLY. NO camera, NO view state, NO timestamps in the document file (R-041: version-only schema). Camera is shell-owned.
2. **Public API surface of `@open-draw/canvas`:** deliberate minimal re-exports PLUS a `createCanvas` controller helper wiring registries + machine into one entry point. The playground shell consumes ONLY this API. This is the forever-contract surface (R-036: `1.0.0` only when stood behind).
3. **Input bindings scope:** full set — escape (cancel/clear selection/exit draw), undo, redo, delete-selected, tool switching. Bindings map events to named actions; they NEVER implement behavior (R-011).

## Work items

### 1. `@open-draw/document` — serialization

- `src/serialize-document.ts`: pure `serializeDocument(doc: Document): string` — emits the ruled entry shape, kebab-case serialized keys, frozen once (R-014). Deterministic: identical documents produce byte-identical output.
- `src/parse-document.ts`: `parseDocument(json: string): Document` — boundary parser (R-006). Reuse `validation.ts` patterns; hand-rolled, no runtime deps (R-002). Unknown schema version, unknown shape kind, malformed shape, or missing `schema` block → typed `DOCUMENT_ERRORS` throw, never silent fallback.
- Serialization order is the document map's insertion order — this IS z-order (the 02b lesson). NEVER sort keys alphabetically: an alphabetical sort silently scrambles z-order on every round-trip. Determinism comes from emitting shapes in map iteration order and each shape's fields in a fixed literal order; JS object string-key enumeration preserves insertion order through `JSON.stringify`, and `parseDocument` rebuilds the map in file order. `serialize(parse(serialize(doc))) === serialize(doc)` must be asserted.
- ROOT_ID is structural — a parent sentinel, not a shape record — and must NEVER appear in the serialized map; parsed documents rebuild it.
- Tests (`serialize-document.test.ts`): round-trip byte-stability (serialize → parse → serialize === original string), z-order preservation through round-trip, rejection cases per R-006 (unknown schema version, unknown shape kind, missing `schema` block, malformed shape), ROOT_ID exclusion.

### 2. `@open-draw/input` — new package

- Follow the blueprint package table; same tsconfig/package.json shape as siblings; zero runtime deps (R-002).
- `src/actions/` — closed registry, uniform layout: one item = one folder = one `index.ts` (R-012), `export const ACTIONS = { cancel: "cancel", undo: "undo", redo: "redo", deleteSelected: "delete-selected", selectTool: "select-tool" } as const` (shorthand forbidden here because key ≠ value), `export type ActionId = (typeof ACTIONS)[keyof typeof ACTIONS]` — the VALUE-UNION type. Registry string values are kebab-case, matching the established `@open-draw/canvas` precedent (`TOOLS`, `HANDLES`, `STATES`, `CANVAS_EVENTS`); R-014's camelCase applies to the member identifiers only.
- `src/resolve-key-binding.ts`: pure `(event: KeyboardEventDescriptor, bindings: KeyBindings) => ActionId | undefined`. Accept a minimal typed event descriptor (key, modifiers) — NO DOM types in the core (framework-free). Default binding table exported alongside; the shell may override.
- Bindings contain NO behavior (R-011). Undo/redo actions exist here as ids only; the shell maps them to history calls.
- Tests: registry completeness, binding resolution incl. modifier cases, unknown-key returns undefined.

### 3. `@open-draw/canvas` — public API surface

- `src/index.ts` (the contract): re-export from contracts + document (types only), and from canvas core: camera helpers, selection helpers, `TOOLS`/`HANDLES`/`STATES`/`CANVAS_EVENTS`, machine, hit-test, geometry.
- `src/create-canvas.ts`: `createCanvas(options)` controller — owns the machine instance, registries wiring, and an event dispatch table; pure-core orchestration, no DOM (R-008/R-009: the shell owns DOM).
- Doc-comment EVERY export — this surface is the contract. No internals exported (R-010).
- Exports stable-ordered; adding to it later = additive only.

### 4. `apps/playground` — shell shrinks to glue

- Save/load buttons → `serializeDocument` / `parseDocument` (typed error surfaced in UI, not swallowed).
- Keydown adapter: DOM `KeyboardEvent` → descriptor → `resolveKeyBinding` → dispatch action to `createCanvas` controller / document history. Shell implements action behavior (R-011); tool switching cycles `TOOLS`.
- Replace direct canvas-core imports with the public API. Boundary rule: the playground may import ONLY the public roots `@open-draw/canvas`, `@open-draw/renderer-svg`, `@open-draw/input`, and `@open-draw/document` — never deep paths (`@open-draw/canvas/src/...`) or unexported internals. All canvas interaction logic flows through `createCanvas` and the public exports (R-010/R-020; mechanical check: no `/src/` import paths in `apps/playground`).
- One committed transaction per action where the document mutates (R-018).

## Constraints

- No file over ~300 lines (R-010). TS strict everywhere; no `any`.
- Packages `@open-draw/input` gets dependency-cruiser/ESLint boundary rules consistent with siblings (R-020): no React, no DOM in core.
- Tests named by behavior: `describe` = subject, `it` = plain-language behavior (R-015).

## Verification

```bash
pnpm check
pnpm --filter @open-draw/document test
pnpm --filter @open-draw/input test
pnpm --filter @open-draw/canvas test
```

Hand-test gate (maintainer, before merge): draw → save → reload → load → shapes identical; undo/redo/delete/tool-switch keys work; escape cancels. CI green ≠ product working (R-034 + maintainer gate).

## Deliverable protocol (R-043)

Ship with: (1) decision inventory of every transcription judgment; (2) quoted rule per file; (3) exact verification commands; (4) independent adversarial review before paste — attack for defects and rule violations; fix all confirmed findings before requesting merge.
