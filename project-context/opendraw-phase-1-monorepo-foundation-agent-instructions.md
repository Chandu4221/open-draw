# OpenDraw Phase 1 — Monorepo Foundation & Guardrails
# — Agent Instructions —

**Repo:** `github.com/Chandu4221/open-draw` (exists; partially scaffolded)
**Branch:** `build/phase-1` → merge to `main` on exit
**Prerequisite reading:** `OPENDRAW.md` (repo root, committed first — see Step 0)

**Terminology (binding):** the engine is a **DOM Canvas** — every shape is a real DOM/SVG element inside one root `<svg>`; the HTML `<canvas>` bitmap element is the rejected alternative and must never be used. Say "DOM Canvas" everywhere; "HTML Canvas" only appears in contrast docs.

---

## STEP 0 — Commit the constitution

1. Commit `OPENDRAW.md` (the project context briefing) to the repo root. This is the agent's primary context; every later instruction hangs off it.
2. Commit the four **ADRs** to `docs/adr/` (content below is the decision record; write each as ~1 page: Context / Decision / Consequences):
   - **ADR-001 Rendering:** DOM Canvas — shapes as real SVG/DOM elements in one root `<svg>`, camera = single transform on root group, overlays are DOM children of shape wrapper groups (`getOverlaySlot` seam). HTML Canvas bitmap explicitly rejected (reason: transform-coherence — overlays must derive from the same transform as their shapes; the predecessor project failed six times on JS-positioned overlays over a bitmap). Note honestly: DOM is the chosen *means*; transform-coherence is the *requirement*.
   - **ADR-002 Parenting:** stored explicit parent (in `meta`, written by semantics/host) is the source of truth; geometric containment is a drop-time *suggestion* only (innermost-frame-wins tie-break); validity events on parent move/delete; no continuous recompute in v0.x.
   - **ADR-003 Grouping:** groups = selection sets + transform ops; members store **absolute coordinates** (no transform tree); schema permits N-level nesting, v0.x UI exposes one level; canvas `group` (`memberIds`) ≠ semantic parent — never shared field names.
   - **ADR-004 Responsive:** derivation, never rendering state. `derive(scene, { width, containers? })` lives in semantics (pure, Node-testable); DOM Canvas gets only a per-shape `hidden` flag + `applyLayout(patch)`; **derived previews are transient and read-only in v0.x** — never persisted, never edited, breakpoint switch = re-derive from canonical.
3. Commit `docs/od-questions.md` (empty list, header only) and `docs/od-spike-notes.md` (empty, header only).

## STEP 1 — Root package.json (replace GitHub's scaffold)

- `"name": "open-draw"`, `"private": true`, `"license": "MIT"`, `"type": "module"`
- `"workspaces": ["packages/*", "apps/*"]` (already present — keep)
- Scripts: `typecheck`, `test`, `build`, `lint` (each runs per-package via workspaces)
- devDependencies (root only): `typescript`, `vitest`, `esbuild`, `vite`, `@playwright/test`, `publint`
- Delete scaffold leftovers (placeholder test script, `main`, ISC fields)

## STEP 2 — LICENSE

- MIT full text at repo root, copyright `2026 Chandra Shekhar`. Each package README states it inherits the repo license.

## STEP 3 — Packages (five, not three — schema package added by audit ruling)

Existing three keep their names. Create the two new ones as the same kind of shell:

| Package | Purpose (one line in README) |
|---|---|
| `@open-draw/canvas` | DOM Canvas engine — every shape a real SVG/DOM element |
| `@open-draw/semantics` | Shape meaning: types, parenting, responsive, platform profiles |
| `@open-draw/markdown` | Pure annotated-scene → markdown compiler, frozen output |
| `@open-draw/schema` | **NEW:** shared structural types (ShapeId, Bounds, snapshots) + pure geometry functions (bounds/containment/intersection); consumed by canvas AND semantics so neither depends on the other at all |
| `@open-draw/studio` (`apps/studio`) | OpenDraw Studio — thin React composition shell |

Every package gets:
- `package.json`: correct name, `"version": "0.0.0"`, `"type": "module"`, `"main"/"exports"` → `src/index.ts`, **`"dependencies": {}`**, **`"publishConfig": { "access": "public" }`**, `"license": "MIT"`
- `tsconfig.json`: strict, `noUncheckedIndexedAccess`, no `any`/`@ts-ignore` anywhere, ESM
- `src/index.ts` stub (schema's stub: `Bounds`, `ShapeId` types + `boundsContain` function — real enough to be useful, small enough to be a shell)
- one passing Vitest smoke test
- README stub (name + one-line purpose + MIT)

## STEP 4 — CI (`.github/workflows/ci.yml`)

On PR + push to `main`:
1. `typecheck` (all packages)
2. `test` (all packages)
3. `build` (all packages)
4. **Import-boundary check** — enforce these arrows and ONLY these:
   ```
   studio ──> canvas, semantics, markdown, schema
   markdown ──> semantics, schema (types only)
   semantics ──> schema (types + geometry code)
   canvas ──> schema (types + geometry code)
   schema ──> nothing
   ```
   Implementation: a small script parsing each package's imports (source `import` statements + built `.d.ts`/JS references). **Also run a build-graph verification** (`tsc` project references or `publint`/`attw`-style check) proving compiled output of `schema` never references canvas/semantics and semantics output never references canvas — grep alone is insufficient (audit ruling).
5. **Dependencies check:** every package's `dependencies` must be `{}` — fail otherwise.
6. **Bitmap check (new, cheap insurance):** grep for `getContext` in `packages/canvas/src` — zero tolerance (the PNG-export exception does not exist yet; when it does, it lands outside the render path with an inline exemption comment).
7. Gate/delete the existing `publish.yml` — nothing publishes until Phase 2 tags `@open-draw/canvas@0.1.0`.

## STEP 5 — THE RED/GREEN PROOF (Phase 1's most important deliverable)

1. On a branch, deliberately add a banned import: `packages/semantics/src/index.ts` importing from `@open-draw/canvas`.
2. Push → CI must go **RED** on the boundary check.
3. Screenshot the failed CI run → commit to `docs/od-verification/1/ci-red.png`.
4. Revert the violation → CI goes **GREEN** → screenshot → `docs/od-verification/1/ci-green.png`.
5. Both commits land on the phase branch. A boundary check that has never been seen failing is a fence nobody has tested.

## STEP 6 — REPORT.md + exit

`docs/od-verification/1/REPORT.md`:
- every checklist item below with the commit hash or file path that proves it
- the exact import-boundary arrows as implemented
- any OD-questions raised (should be ~zero this phase; if more than 3, stop and report)

**PHASE 1 EXIT CHECKLIST (all, or the phase fails):**
- [ ] `OPENDRAW.md` + 4 ADRs + question/spike logs committed
- [ ] Root package.json correct (MIT, module, scripts, devDeps) — no scaffold leftovers
- [ ] LICENSE at root
- [ ] Five packages: correct names, `dependencies: {}`, `publishConfig.access: public`, strict tsconfig, passing smoke test each
- [ ] `@open-draw/schema` exists with real Bounds/ShapeId + `boundsContain` + passing test
- [ ] CI green end-to-end: typecheck → test → build → boundaries (incl. build-graph) → deps {} → bitmap grep
- [ ] RED screenshot + GREEN screenshot committed
- [ ] REPORT.md complete, every claim cited
- [ ] `build/phase-1` merged to `main`

**Rules in force:** small commits (`type(scope): what (phase.1.N)`) · TS strict, no `any` · anything unspecified → `docs/od-questions.md`, never invention · no file > 500 lines (nothing should come close this phase).

**After exit, Phase 2 opens with (in order):** schema package's geometry core → DOM Canvas store → camera → **overlay-invariant E2E committed before the render code that satisfies it** → registry contract → benchmark spike before any perf budget enters docs. Do not start any Phase 2 work inside Phase 1.