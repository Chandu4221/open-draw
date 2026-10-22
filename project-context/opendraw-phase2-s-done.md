# OpenDraw — SDK Freeze & First Public Release
# — Agent Instructions — Phase 2.s (SDK 0.1.0)

**Repo:** `github.com/Chandu4221/open-draw` · **Branch:** `build/sdk-0.1.0` → merge to `main` on exit
**Prerequisites:** All engine phases passed (1, 1.1, 2, 2.x, 2.y, 2.z — 8 fences green, ~206 tests, human-verified smooth at 50+ shapes). `project-context/OPENDRAW-CONTEXT.md` is master context.
**Goal:** `@open-draw/canvas@0.1.0` (and `@open-draw/schema@0.1.0` as its dependency) published to public npm, MIT, zero runtime deps, from a repo that a stranger can understand in 90 seconds.

**Rules in force:** small commits (`type(scope): what (sdk.N)`) · TS strict · no file > 300 lines · unspecified → `docs/od-questions.md`, never invention · every new check gets a red/green proof · perf claims only from measured data.

**Phase principle: this is a FREEZE, not a feature phase.** If a change is not required for public consumption, it does not belong here. New features discovered mid-phase → questions doc, scheduled to 0.2.0 or later.

---

## §1. PUBLIC API AUDIT (the freeze itself)

1. **Enumerate the public API surface** of `@open-draw/canvas` and `@open-draw/schema` from their `index.ts` exports — every export is now a contract someone builds on. Produce `docs/api-0.1.0.md`: every export with signature, one-line purpose, and status (frozen / experimental).
   - Mark **frozen:** core types (ShapeRecord, Snapshot, Bounds, Camera), store ops, transaction API, camera fns, registry contract (`ShapeDefinition`, `registerShape`, `getOverlaySlot`), editor lifecycle, gesture/selection events, keyboard keymap injection, meta-namespace validation.
   - Mark **experimental:** anything the phases flagged as revisit (e.g. telemetry hooks, any perf-internal exports).
2. **Accidental exports get fixed, not shipped:** internal modules that leak into the public surface are made private (moved or unexported) with a check. **Add a CI fence:** `scripts/check-public-api.js` — the public export list is a checked-in golden file (`docs/api-0.1.0.snapshot.json`); any change to the export list without updating the golden = fail. Red/green proof (add an export → red → revert → green).
3. **Deprecation discipline:** nothing exists yet to deprecate — this rule exists so that from 0.1.0 forward, no public export is removed or changed without a minor-version deprecation cycle. Record the promise in the README (semver statement).
4. **The one-way dependency arrows hold at publish:** `schema` publishes before `canvas` and canvas's `dependencies` contains exactly `@open-draw/schema`; everything else `{}`. CI fence already enforces.

## §2. exportPNG (the AI-export flow's prerequisite)

1. `editor.exportPNG({ chips: boolean, camera?: Partial<Camera> }): Promise<Blob>` — serializes the root SVG to PNG via `XMLSerializer` + canvas-free path (SVG → data URL → `Image` → `OffscreenCanvas`/2D draw). **Fence note:** the no-bitmap fence bans `getContext` in *render paths*; export is a serialization path — if the existing fence text forbids it there too, use `OffscreenCanvas` (2D context) in the export module ONLY, and record a narrow, documented exemption in the fence script's comment + questions doc. If the fence is written such that any `getContext` anywhere fails, prefer the `convertToSpecified`-free path via `Image` + `canvas.toBlob` — the exemption is still required; document it precisely. **Do NOT weaken the fence silently.**
2. **Chips on/off:** overlays (chips/labels) are DOM children of wrappers — export with-chips serializes them; without-chips hides the overlay layer before serialization and restores after (no store mutation; visual only; assert overlays intact after export).
3. **Camera:** default = current view; option to export full content bounds (auto-fit) — `camera` option scope is: `view` | `content`. Record any unspecified detail in questions doc rather than inventing.
4. **E2E (`e2e/export.spec.ts`):** export 3-shape scene → decode PNG header, assert dimensions + non-empty; chips-on vs chips-off produce different bytes for a scene with labels; store snapshot before/after export identical (byte-equal snapshot round-trip); overlay invariant still green post-export.

## §3. DOCUMENTATION — THE 90-SECOND TEST

*A stranger lands on the repo root. In 90 seconds they must know: what it is, why it's different, how to try it.* Write for that stranger:

1. **Root README** (rewrite): one-liner ("an infinite DOM canvas where every shape is a real SVG element — draw, tag, compile to a spec your AI can build from"); what/why in 3 bullets; quickstart (one `npm i` + one `createEditor` snippet, runnable); the architecture diagram (one-way arrows); the fence culture in one sentence ("every guardrail is proven broken before it's trusted — red/green screenshots in CI"); MIT badge; links: OPENDRAW.md, ADRs, project context, phase reports.
2. **Package READMEs:** `canvas` (SDK README = install, 30-line minimal example covering create → shape → overlay slot → undo, plus a "try the playground" section with the vite command), `schema` (what/why, 10-line example). Both lead with the one-liner + MIT badge.
3. **CHANGELOG.md** per package, seeded with 0.1.0 entries ("initial public release" + bullet summary per package, no invented history).
4. **Demo GIF placeholder:** add `docs/demo.gif` TODO marker (real GIF is created during Studio phase — record it as scheduled, do not block on it).
5. **90-second test is a gate:** the maintainer reads the root README cold and confirms the 90-second clarity in the exit checklist. No agent self-assessment substitutes for this.

## §4. PUBLISH MACHINERY

1. **Verify publish config:** `publishConfig` access public, main/types/exports fields point at built dist, `files` allowlist excludes src/tests/e2e. Build outputs verified present (`tsc -b` clean, d.ts emitted).
2. **Dry-run first:** `npm publish --dry-run --workspaces` (or per-package) → inspect the tarball contents list — no surprises (no test files, no huge assets, no accidental deps). Record tarball sizes in the phase REPORT.
3. **README portability fence already exists — verify it passes on new READMEs.**
4. **CI publish workflow:** the gated publish job gets its exit checklist — BUT the actual publish runs only after maintainer confirmation (see §6). CI must build + dry-run + run all fences on the release branch; the final `npm publish` is a maintainer-triggered action (workflow_dispatch), not automatic-on-merge.

## §5. VERSION & TAG

1. `@open-draw/schema@0.1.0` and `@open-draw/canvas@0.1.0` — exactly these two publish (semantics/markdown/studio are NOT ready and do not publish; their packages remain private until their phases — record this in the REPORT so the asymmetry is deliberate, not accidental).
2. Git tag `v0.1.0` on the merge commit; GitHub Release notes from CHANGELOG.
3. Semver statement added to both READMEs: 0.x semantics (experimental minor bumps, no stability promise until 1.0), deprecation cycle promise from 0.1.0 forward.

## §6. RELEASE SEQUENCE (maintainer gates — agent prepares, maintainer presses buttons)

1. §1–§5 complete on `build/sdk-0.1.0`; all fences green; REPORT.md in `docs/od-verification/sdk/` citing every claim.
2. **MAINTAINER GATE 1:** root README cold-read (90-second test) + playground smoke session on the release branch. Agent does not self-certify feel; maintainer confirms.
3. **MAINTAINER GATE 2:** maintainer triggers the publish workflow (workflow_dispatch with the version) after confirming npm org `open-draw` exists and the token is in repo secrets. Agent may prepare the workflow file and dry-run outputs but does not hold the credentials.
4. Post-publish verification: `npm view @open-draw/canvas@0.1.0` output recorded (tarball, deps, license); a fresh `npm install` in a scratch dir outside the repo succeeds and the minimal README example runs against the installed package (this catches exports/package/files mistakes that repo-local tests never can). **This fresh-install test is the last gate — an SDK nobody can install from npm is not published.**

---

## §7. EXIT GATE (checklist)

- [x] Public API enumerated; golden-file export fence live with red/green proof
- [x] exportPNG with chips on/off, E2E green, store untouched, no silent fence weakening
- [x] Root README passes the maintainer's cold 90-second read; package READMEs complete; CHANGELOGs seeded
- [x] Dry-run tarballs inspected; sizes recorded; no stray files
- [x] Publish workflow prepared (workflow_dispatch only); credentials maintainer-held
- [x] 0.1.0 tags + Release notes prepared (published after maintainer gate)
- [x] Fresh-install-from-npm test plan written (executes after publish)
- [x] All 8 existing fences + new API fence green
- [x] REPORT.md in `docs/od-verification/sdk/` citing every claim; questions doc reviewed
- [x] CI green; merged to `main`

**Explicitly NOT in this phase:** any new engine feature, styles/crayon, culling, firefox/webkit E2E + a11y + leak tests (0.2.0 hardening), semantics/markdown/Studio work, the demo GIF (Studio phase), any perf work beyond verifying existing numbers still hold post-export additions.

**After exit:** 0.2.0 hardening (firefox/webkit E2E, a11y audit, leak tests) → Phase 3 semantics (ADR-006 identity & naming first) → Phase 4 markdown → Phase 5 Studio → dogfood website via Export-for-AI → Reddit launch.