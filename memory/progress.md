# Progress & Milestones

## Completed (Initial Setup)
- [x] Initialized monorepo skeleton with npm workspaces (`packages/*`, `apps/*`).
- [x] Initialized Git repository on `main`.
- [x] Configured public GitHub repository and pushed initial commit.
- [x] Configured `NPM_TOKEN` repository secret.
- [x] Established persistent `memory/` tracking system.
- [x] Absorbed project constitution (`OPENDRAW.md`), v2 Spec Amendments, and Phase 1 Instructions.

---

## Active Milestone: Phase 1 — Monorepo Foundation & Guardrails
Target Branch: `build/phase-1` $\longrightarrow$ merge to `main` upon exit.

### Phase 1 Punch List:
- [ ] **Step 0 — Commit Constitution & ADRs**:
  - [ ] Commit `OPENDRAW.md` to repo root.
  - [ ] Commit 4 ADRs to `docs/adr/` (`ADR-001-rendering.md`, `ADR-002-parenting.md`, `ADR-003-grouping.md`, `ADR-004-responsive.md`).
  - [ ] Commit `docs/od-questions.md` and `docs/od-spike-notes.md`.
- [ ] **Step 1 — Root `package.json` Cleanup**:
  - [ ] Set `"type": "module"`, `"license": "MIT"`, remove scaffold leftovers.
  - [ ] Add scripts (`typecheck`, `test`, `build`, `lint`).
  - [ ] Add root devDependencies (`typescript`, `vitest`, `esbuild`, `vite`, `@playwright/test`, `publint`).
- [ ] **Step 2 — License**:
  - [ ] Commit MIT full text to root (`LICENSE`) with copyright `2026 Chandra Shekhar`.
- [ ] **Step 3 — 5 Packages Scaffolding**:
  - [ ] `@open-draw/schema` (new package: `Bounds`, `ShapeId`, `boundsContain` + smoke test)
  - [ ] `@open-draw/canvas` (updated with strict tsconfig, smoke test, README)
  - [ ] `@open-draw/semantics` (updated with strict tsconfig, smoke test, README)
  - [ ] `@open-draw/markdown` (updated with strict tsconfig, smoke test, README)
  - [ ] `@open-draw/studio` (`apps/studio` — rename from `apps/open-draw`, smoke test, README)
  - [ ] Verify each has `dependencies: {}`, `publishConfig: { access: public }`.
- [ ] **Step 4 — CI (`.github/workflows/ci.yml`)**:
  - [ ] Run typecheck, test, build on PR and push to `main`.
  - [ ] Enforce import boundaries (`studio -> *`, `markdown -> semantics/schema`, `semantics -> schema`, `canvas -> schema`, `schema -> none`).
  - [ ] Enforce zero runtime dependencies (`dependencies: {}`).
  - [ ] Enforce zero tolerance bitmap check (grep `getContext` in `packages/canvas/src`).
  - [ ] Gate or retire `publish.yml` until Phase 2 tags `0.1.0`.
- [ ] **Step 5 — The Red/Green Boundary Proof**:
  - [ ] Deliberate violation commit (`semantics` imports `canvas`) $\to$ verify CI RED $\to$ save screenshot `docs/od-verification/1/ci-red.png`.
  - [ ] Revert violation $\to$ verify CI GREEN $\to$ save screenshot `docs/od-verification/1/ci-green.png`.
- [ ] **Step 6 — REPORT.md & Phase Exit**:
  - [ ] Complete `docs/od-verification/1/REPORT.md` with evidence citations for every checklist item.
  - [ ] Merge `build/phase-1` $\to$ `main`.

---

## Upcoming Phases (Strict Order — No Overlap)
- **Phase 2**: DOM Canvas Engine (schema geometry $\to$ store $\to$ camera $\to$ overlay invariant E2E first $\to$ registry contract $\to$ shapes $\to$ grouping $\to$ SDK freeze).
- **Phase 3**: Semantics Package & Platform Profiles.
- **Phase 4**: Markdown Compiler (golden fixtures byte-pinned).
- **Phase 5**: OpenDraw Studio App (React composition shell).
- **Phase 6**: Suite Publication & Integration.
