# Milestone 07 — Fix pass (no new features)

**Place at:** `docs/plans/milestone-07-agent-instructions.md`
**Read first:** `AGENTS.md` and `docs/rules/RULES.md`. Everything in `AGENTS.md` applies. This file only adds the task list.
**Baseline:** `main` @ `387d628`. Before any task run `git log -1 --format=%h`. If it differs, STOP and tell the owner.
**Replaces** the earlier draft of this file.

## Purpose

Fix what is wrong in the repo before any new feature. No new shapes, tools, platforms, styles, UI or dependencies in `packages/*`.
Order: real bugs first, then docs and enforcement, then refactors, then report-only checks.

## How to run this plan

- One task = one branch = one PR. Never combine tasks. Work in the order given.
- A bug fix starts with a RED failing test that you show failing, then the fix (RULES.md drift protocol).
- A task marked **NEEDS RULING** may not start until the owner writes "RATIFIED: <id>" in chat.
- Ask ONE question at a time when stuck (AGENTS.md section 3). Never pick a default.
- Every PR uses the report format in `AGENTS.md` section 9 and names the rule it implements.
- You never mark an ADR Accepted and never edit RULES.md. You may DRAFT an ADR or rule as "Proposed".

## Rulings the owner must make (agent must not decide)

| ID  | Question                                                                                                            | Status / Ruling                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Typing guard: a pure helper in `packages/input` takes a plain boolean "target is editable", the shell computes it.  | **RATIFIED (2026-11-02)**: Pure helper in `packages/input` (`shouldHandleKeyEvent`) with `isEditableTarget: boolean`.                                                                                                                 |
| R2  | Tool shortcut keys R/O/L/P move into `DEFAULT_KEY_BINDINGS` as named actions (R-011). What should `KeyT` do?        | **RATIFIED (2026-11-02)**: Option 1 (tldraw keybindings). Remove `KeyT`, map `KeyV`/`Digit1` → `selectTool`, `KeyR` → `selectToolRect`, `KeyO` → `selectToolEllipse`, `KeyL` → `selectToolLine`, `KeyP`/`KeyD` → `selectToolPenPath`. |
| R3  | Labels: only escape at export time, or also restrict at load? Stricter load rejects documents saved earlier.        | **RATIFIED (2026-11-02)**: Escape at export only (preserves stored document compatibility, sanitizes newlines, formatting markers, and HTML).                                                                                         |
| R4  | Cap undo history size? If yes, what number?                                                                         | Owner picks, or leave unbounded for now                                                                                                                                                                                               |
| R5  | Which packages must be DOM-free at type level? R-020 requires `contracts` and `document`.                           | **RATIFIED (2026-11-02)**: All headless core packages (`contracts`, `document`, `semantics`, `export-markdown`).                                                                                                                      |
| R6  | Add root dev tools for rule enforcement (dependency-cruiser, extra ESLint rules). Dev only, never package runtime.  | **RATIFIED (2026-11-02)**: Option 1. Install `dependency-cruiser` as root `devDependency`.                                                                                                                                            |
| R7  | ADR-0003 D6 and ADR-0005 D6 give different dependency tables, and neither lists `canvas -> input`. Which is right?  | **RATIFIED (2026-11-02)**: Option 1. `canvas -> input` is explicitly allowed (batteries-included design). Canonical dependency matrix encoded in `dependency-cruiser`.                                                                |
| R8  | R-019 names events (`documentChanged`, `selectionChanged`, `historyChanged`) that do not exist. Implement or amend. | Decide after Phase A–C, not before                                                                                                                                                                                                    |

---

## PHASE A — Real bugs (RED test first)

### A1 — Keyboard shortcuts fire while typing · branch `fix/ignore-keys-while-typing` · NEEDS RULING R1

Evidence (re-verify by opening the file): `apps/playground/src/App.tsx` `onKeyDown` (starts line 705) is attached to `window` and has no check of where the key was pressed.
The playground has text inputs (line 1162 onward). Result: typing `r`, `o`, `l`, `p`, `v` in a label field switches tools; Space starts panning;
Backspace/Delete in the label field deletes the selected shape and `preventDefault` blocks the text edit.
Rule: R-011 (named actions), R-008 (pure core, imperative shell).
Steps:

1. In `packages/input`, add a pure function that returns whether a key event should be handled, from a plain descriptor with an `isEditableTarget` boolean. Write the failing tests first.
2. In the playground shell, compute that boolean from the event target (input, textarea, select, contentEditable) and call the pure function before handling any key.
3. Behavior otherwise unchanged. Report how you verified the playground by hand (list the exact steps).

### A2 — Tool keys live in the playground, not in `input` · branch `fix/tool-keys-into-input-bindings` · NEEDS RULING R2, after A1

Evidence: `App.tsx` lines 710-731 hard-code `KeyV/KeyR/KeyO/KeyL/KeyP`. `packages/input/src/keyboard.ts` has `KeyV` and `KeyT`, both mapped to `selectTool`, and nothing for R/O/L/P.
Rule: R-011 ("Input bindings map events to named actions from a registry; they never implement behavior").
Steps: add the named actions and bindings in `packages/input` with tests, remove the duplicate hard-coded handling from the playground. Do not change what any key does except as ruled in R2.

### A3 — Markdown export writes user text raw · branch `fix/markdown-export-escape-user-text` · NEEDS RULING R3

Evidence: `packages/export-markdown/src/export-markdown.ts` inserts `displayName` (derived from the user's label) and property values (`String(value)`) straight into headings and bullets.
A label with a newline, `#`, `**` or a backtick breaks the structure. This file is meant for AI handoff, so a crafted label can also inject text that looks like instructions.
Labels are only checked as "is a string" (`packages/document/src/validation.ts` around line 240).
Steps: write failing tests with hostile labels first (newline + fake heading, backticks, bold markers, very long text). Add one escaping helper in this package and use it for every user-derived string. The zero-geometry rule of ADR-0005 D2 must stay true.

### A4 — SVG text escaping is done in one place only · branch `fix/svg-escape-everywhere` · no ruling needed

Evidence: `packages/renderer-svg/src/overlays/chip-overlay.ts` escapes `& < > " '`. `fallbackShapeToSvg` in `packages/renderer-svg/src/index.ts` inserts the shape kind into `<text>[...]</text>` unescaped, and colors passed in options go into attributes unescaped.
It is safe today only because kinds are validated at load. The playground assigns the whole string with `svg.innerHTML` (App.tsx around line 306), so any future unescaped value becomes an injection.
Steps: failing tests with hostile strings first; one shared escape function inside `renderer-svg`; use it for every text and attribute value that is not a number produced by `toFixed`/validated numbers. No change to output for normal input (existing tests must pass unedited).

---

## PHASE B — Make the repo tell the truth and enforce its rules

### B1 — Docs match code · branch `docs/sync-docs-with-code`

Rule: R-038. Do exactly this and nothing else:

1. `docs/about/roadmap.md`: remove the "Paste this into…" header. Mark milestones 3, 4, 5, 6 as shipped, citing the plan doc or commit for each. Dates only from `git log`.
2. `packages/readme.md`: list exactly the folders under `packages/`. Remove `commands`, `history`, `react` (they are not packages). Fix `README.md` vs `readme.md` in the tree.
3. `docs/about/readme.md`: replace `@opendraw/` with `@open-draw/` everywhere. Remove the six hot-linked `images.openai.com` lines (third-party stock images, R-001/R-003). Sections 11, 13, 14: do NOT rewrite. List each statement that disagrees with code in the PR and ask the owner.
4. `apps/studio/README.md` is the Vite template. Replace with five factual lines (what Studio is today after reading its source, and one run command you have executed).
5. `docs/architecture/overview.md` and `docs/contracts/document-model.md` are 0 bytes: do not fill them; report "empty, owner decides".
6. `docs/decisions/0001-core-boundaries.md`: fix the dead link `docs/rules/opendraw-rules-md.md` to `docs/rules/RULES.md`.
7. Plan docs: `milestone-04-extension-system.md` says RATIFIED but still has five open `[RULING]` tags; `milestone-05-semantic-wireframing.md` still says "PRE-RULING draft". Do not edit them; list them for the owner.
   Done when every path and identifier named in the edited docs exists (open each).

### B2 — Core packages can see browser types · branch `build/dom-free-core-packages` · NEEDS RULING R5

Evidence: `tsconfig.base.json` has `lib: ["ES2022","DOM","DOM.Iterable"]` and `contracts`, `document`, `semantics`, `export-markdown` extend it unchanged. Code using `window` or `document` would compile inside them, which defeats R-020 ("no React, no SVG-DOM").
Steps: for the packages named in R5, override `lib` without DOM in their `tsconfig.json`. Typecheck and tests must pass. If anything fails because it needs DOM types, STOP and report the file; do not work around it.

### B3 — Enforce the rules with tools, RED first · branch `build/enforce-rules` · NEEDS RULINGS R6, R7

Rules: R-020 ("A boundary that is not lint-enforced is not a boundary."), R-014.

1. Root dev tools only, pinned versions.
2. Encode the dependency table from the real `package.json` files plus the owner's answer to R7. Add a CI step.
3. Commit the checks so they FAIL exactly on today's real violations; show the output. Never weaken a rule to get green.
4. R-014 naming lint: list what R-014 requires and what the tools can and cannot check; implement only what the owner approves.

### B4 — String literals in internals · branch `refactor/use-registries-not-literals`

Rule: R-005. Known sites (re-verify each; list may be incomplete):
`packages/document/src/validation.ts` (`kind === "section"`, `"line"`, `"pen-path"`, and `k !== "id"|"kind"|"parent"|"label"|"meta"`),
`packages/document/src/serialize-document.ts` (`case "page"`… `"pen-path"`),
`packages/document/src/commands/set-shape-bounding-box/index.ts` (`case "line"`, `"pen-path"`),
`packages/semantics/src/display-name.ts` (`=== "page"`).
Use `SHAPE_KINDS` from `@open-draw/contracts`. If a literal has no registry entry, STOP and ask. No behavior change; no test edits.

### B5 — Dead config and CI hardening · branch `chore/remove-unused-config`

1. `renderer-svg` declares `@open-draw/shapes` and `export-markdown` declares `@open-draw/profiles`, with no import of either in their source. Re-verify, then remove and run `pnpm install` so the lockfile updates.
2. `pnpm-workspace.yaml` lists `tooling/*`; the folder does not exist. Remove the line if still absent.
3. `.github/workflows/ci.yml` has no `permissions` block. Add `permissions: contents: read`. In `release.yml`, `verify-main` uses `actions/checkout@v4` while the rest use `v5`; ask the owner before changing.
4. Root `package.json` `license` field: ask the owner for the exact value.

---

## PHASE C — Refactor (only after A and B are merged)

### C1 — Split oversize files · branch `refactor/split-oversize-files`

Rule: R-010. Targets: `apps/playground/src/App.tsx` (1558 lines), `packages/document/src/validation.ts` (315 lines).

1. Show the owner the proposed split (file names, one line each). Wait for "approved".
2. Move code only. No renames, no logic edits, no public export changes.

---

## PHASE D — Report only (do NOT fix; hand findings to the owner)

- **D1 — Type casts.** There are about 73 `as` casts outside tests. List each with file and line and classify: legitimate boundary brand cast (R-006), or unsafe. Change nothing.
- **D2 — Deep nesting.** Unverified: whether loading or walking a document with a 10,000-level parent chain overflows the stack. Write a test that tries it and report the real result. Fix nothing without a ruling.
- **D3 — Undo history has no size limit** (`packages/document/src/history.ts` never trims). Report only; cap needs ruling R4.
- **D4 — Packaging.** No package has a build script. Every `exports` points at `./src/index.ts` and every package is `private` at `0.0.0`. Outsiders cannot install the SDK as it is. Report only: describe what a stranger would have to do today. Do not change anything; this needs an ADR from the owner.
- **D5 — R-019.** Confirm again that no code emits the three named events. Report only (ruling R8).
- **D6 — Tests.** `apps/playground` and `apps/studio` have no tests, and Playwright is installed with no e2e test or config. Report only.

## Already checked, no action needed

`any`: 0. `@ts-ignore`/`@ts-expect-error`: 0. `eslint-disable`: 0. `console`/`debugger`: 0. `TODO`/`FIXME` in code: 0. `enum`: 0. Timestamps in documents: 0. `Math.random` in rendering: 0.
Strict TypeScript flags are on. Cycle, duplicate-id and unknown-parent checks exist in `packages/document/src/document.ts`. Chip overlay and crayon style both have tests.
Format, lint, typecheck, tests and build pass on `387d628` when run per package.

## Not allowed in this milestone

New features, new dependencies in `packages/*`, renaming public APIs, deleting or weakening tests, editing RULES.md or any Accepted ADR, touching `.github/workflows` outside B3/B5, tagging or releasing.
