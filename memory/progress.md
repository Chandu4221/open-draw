# Progress & Milestones

## Completed (Initial Setup & Phase 1)
- [x] Initialized monorepo skeleton with npm workspaces (`packages/*`, `apps/*`).
- [x] Initialized Git repository on `main`.
- [x] Configured public GitHub repository and pushed initial commit.
- [x] Configured `NPM_TOKEN` repository secret.
- [x] Established persistent `memory/` tracking system.
- [x] Absorbed project constitution (`OPENDRAW.md`), v2 Spec Amendments, and Phase 1 Instructions.

---

## Phase 1 — Monorepo Foundation & Guardrails (Completed)
Target Branch: `build/phase-1` $\longrightarrow$ merged to `main` upon exit.

### Phase 1 Punch List:
- [x] **Step 0 — Commit Constitution & ADRs**:
  - [x] Commit `OPENDRAW.md` to repo root (`5c8fc7c`).
  - [x] Commit 4 ADRs to `docs/adr/` (`ADR-001-rendering.md`, `ADR-002-parenting.md`, `ADR-003-grouping.md`, `ADR-004-responsive.md`).
  - [x] Commit `docs/od-questions.md` and `docs/od-spike-notes.md`.
- [x] **Step 1 — Root `package.json` Cleanup**:
  - [x] Set `"type": "module"`, `"license": "MIT"`, remove scaffold leftovers (`7b9a6bd`).
  - [x] Add scripts (`typecheck`, `test`, `build`, `lint`, `verify`).
  - [x] Add root devDependencies (`typescript`, `vitest`, `esbuild`, `vite`, `@playwright/test`, `publint`).
- [x] **Step 2 — License**:
  - [x] Commit MIT full text to root (`LICENSE`) with copyright `2026 Chandra Shekhar` (`ab5b560`).
- [x] **Step 3 — 5 Packages Scaffolding**:
  - [x] `@open-draw/schema` (new package: `Bounds`, `ShapeId`, `boundsContain` + smoke test).
  - [x] `@open-draw/canvas` (updated with strict tsconfig, smoke test, README).
  - [x] `@open-draw/semantics` (updated with strict tsconfig, smoke test, README).
  - [x] `@open-draw/markdown` (updated with strict tsconfig, smoke test, README).
  - [x] `@open-draw/studio` (`apps/studio` — renamed from `apps/open-draw`, smoke test, README).
  - [x] Verified each has `dependencies: {}`, `publishConfig: { access: public }` (`60db3c6`).
- [x] **Step 4 — CI (`.github/workflows/ci.yml`)**:
  - [x] Run typecheck, test, build on PR and push to `main` and `build/**`.
  - [x] Enforce import boundaries (`studio -> *`, `markdown -> semantics/schema`, `semantics -> schema`, `canvas -> schema`, `schema -> none`).
  - [x] Enforce zero runtime dependencies (`dependencies: {}`).
  - [x] Enforce zero tolerance bitmap check (grep `getContext` in `packages/canvas/src`).
  - [x] Removed `publish.yml` until Phase 2 (`785c12e`).
- [x] **Step 5 — The Red/Green Boundary Proof**:
  - [x] Deliberate violation commit (`semantics` imports `canvas`) $\to$ verified CI RED in GitHub Actions run `39398304246` $\to$ saved screenshot `docs/od-verification/1/ci-red.png` (`f7598aa`).
  - [x] Reverted violation $\to$ verified CI GREEN in GitHub Actions run `39398686496` $\to$ saved screenshot `docs/od-verification/1/ci-green.png` (`77ace07`).
- [x] **Step 6 — REPORT.md & Phase Exit**:
  - [x] Complete `docs/od-verification/1/REPORT.md` with evidence citations for every checklist item (`0f1e2c6`).
  - [ ] Merge `build/phase-1` $\to$ `main`.

---

## Upcoming Phases (Strict Order — No Overlap)
- **Phase 2**: DOM Canvas Engine (schema geometry $\to$ store $\to$ camera $\to$ overlay invariant E2E first $\to$ registry contract $\to$ shapes $\to$ grouping $\to$ SDK freeze).
- **Phase 3**: Semantics Package & Platform Profiles.
- **Phase 4**: Markdown Compiler (golden fixtures byte-pinned).
- **Phase 5**: OpenDraw Studio App (React composition shell).
- **Phase 6**: Suite Publication & Integration.
