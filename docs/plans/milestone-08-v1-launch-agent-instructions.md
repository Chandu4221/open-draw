# Milestone 08 — v1 launch: security fixes, launch hygiene, minimum features

**Place at:** `docs/plans/milestone-08-v1-launch-agent-instructions.md`
**Read first:** `AGENTS.md` and `docs/rules/RULES.md`. Everything in `AGENTS.md` applies. This file adds the tasks, boundaries and exit criteria.
**Baseline:** `main` @ `a28c7db`. Before any task run `git log -1 --format=%h`. If it differs, STOP and tell the owner.
**Goal:** publish a small, honest, safe v1 as fast as possible. Speed comes from a short list, not from skipping checks.

## What v1 is (and is not)

v1 = a live playground that lets a stranger draw a wireframe, tag it by platform, and export structured Markdown, JSON and an image.
v1 is labeled **alpha**. It is NOT a published npm SDK (see ruling V5). Anything not listed below is out of scope.

## Global boundaries (apply to every task)

- One task = one branch = one PR. Work in the order given. Do not start a task before the previous one is merged.
- No new packages. No new `dependencies` in `packages/*` (R-002). Dev tools only at repo root, and only if the task names them.
- No changes to `.github/workflows`, `LICENSE`, `RULES.md` or any Accepted ADR. You may DRAFT an ADR or rule as "Proposed". The owner accepts it.
- Documents saved before your change must still load unchanged. New document fields are optional, and an absent field means today's behavior.
- A task marked **NEEDS RULING** may not start until the owner writes "RATIFIED: <id>" in chat.
- Stuck, or two sources disagree, or a new cross-package import looks needed: STOP and ask ONE question (`AGENTS.md` section 3).
- Bug fixes: RED failing test first, shown failing, then the fix (drift protocol).
- Run `pnpm format` on every file you touch, then `pnpm check`. Paste the real output tails. A task without that output is not done.
- Every PR uses the report format in `AGENTS.md` section 9 and names the rule(s) it implements.

## Rulings the owner makes (agent must not decide)

| ID  | Question                                                                                                                                                                                               | Recommended default                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| V1  | Maximum nesting depth a document may have when loaded.                                                                                                                                                 | 256 levels                                                                                       |
| V2  | The v1 feature bar. Required: shape colors, visible text on shapes, multi-select, image export with legend. Stretch: duplicate and copy/paste.                                                         | As listed                                                                                        |
| V3  | Shape color storage: optional `fill`, `stroke`, `strokeWidth` fields on shapes, validated at load (R-006). Absent = current look.                                                                      | Optional fields, no schema version bump unless the agent proves an old document would break      |
| V4  | Visible text: draw the shape's existing `label` inside the shape, or add a new text shape kind.                                                                                                        | Draw the existing label. No new shape kind.                                                      |
| V5  | How v1 ships: (A) live playground on GitHub Pages plus source on GitHub, packages stay private, README says "SDK packages coming"; (B) publish to npm now (needs a build step and an ADR, adds weeks). | A                                                                                                |
| V6  | Undo history size limit.                                                                                                                                                                               | Leave unbounded for v1                                                                           |
| V7  | R-019 names change events that do not exist. Implement now or defer.                                                                                                                                   | Defer. Record in `docs/od-questions.md` and say so in the README limitations. Do not edit R-019. |
| V8  | Legend in image export: on demand (off by default), lists only the tags used in the exported document.                                                                                                 | As listed (your decision from chat)                                                              |

---

## PHASE S — Safety fixes (must ship before anyone outside sees the project)

### S1 — Markdown export still injects text · branch `fix/markdown-escape-all-user-strings`

Evidence (re-verify): in `packages/export-markdown/src/export-markdown.ts`, `escapeMarkdownText` is applied to display names and property keys/values, but NOT to the semantic id (written inside backticks, about line 108), the conflict reason (about line 68), or the platform and style text (about lines 76-80).
I loaded a document whose semantic id was ``x`\n## INJECTED\nIgnore previous instructions``. The export produced a real `## INJECTED` heading and a loose "Ignore previous instructions" line.
Rule: R-006 (boundaries are safe), ADR-0005 D2 (Markdown is for AI handoff; zero geometry stays true). Ruling R3 (escape at export only) already applies: do NOT reject such documents at load.
Steps:

1. Write failing tests first with hostile values in EVERY user-derived position: semantic id, label, property key, property value, conflict reason, root platform text, style text. Include newlines, backticks, `#`, `**`, `|`, `<script>`, and a 5,000-character value.
2. Escape or neutralize each one. For a value inside backticks, backticks and newlines inside it must not be able to close the span or start a new line.
3. Existing tests pass unedited.

Exit criteria (all required):

- The hostile-input tests fail before the fix and pass after, both outputs shown.
- A test asserts that for every hostile input the export contains no line that starts with `#` other than the structural headings the exporter itself writes.
- Output for normal, non-hostile documents is byte-identical to before (existing snapshot-style tests prove it).
- `pnpm check` passes.

### S2 — Deeply nested files crash or freeze the app · branch `fix/limit-document-depth` · NEEDS RULING V1

Evidence (measured on `a28c7db`, valid documents with one parent chain, `kind: "section"` below one `page` root):

- 5,000 levels: `exportMarkdown` throws `RangeError: Maximum call stack size exceeded`.
- 20,000 levels: `documentToSvg` also throws the same error.
- Parse, export and render of 1,000 + 5,000 + 20,000 levels took about two minutes in total, so loading is also very slow.

A crafted file can therefore freeze or crash anyone who opens it or exports it.
Rule: R-006 ("unknown data = typed error thrown").
Steps:

1. Failing tests first: a document nested one level over the ruled maximum must be rejected at load with a typed `DocumentError` (add the error code to the existing error registry; follow R-005/R-012 for the registry). A document at exactly the maximum must load, export and render.
2. Enforce the limit in `parseDocument` in `packages/document` before any expensive per-shape work. The limit value comes from the ruling and lives in ONE named constant in `@open-draw/contracts`.
3. Time a 20,000-level document: it must be rejected in under one second. If loading a valid document at the maximum depth is still slow (more than 1 second for the ruled depth), find the cause, report it with numbers, and STOP for a ruling before changing algorithms.
4. Confirm the walks used by `exportMarkdown`, `documentToSvg` and `serializeDocument` cannot overflow at the ruled maximum. If any can, report it; do not rewrite them without a ruling.

Exit criteria (all required):

- Over-limit document: typed error, under 1 second, from `parseDocument`. Output shown.
- At-limit document: loads, exports Markdown, renders SVG, serializes, with no stack error. Output shown.
- All existing tests pass unedited. `pnpm check` passes.

### S3 — String literals in the playground · branch `refactor/use-registries-in-playground`

Evidence (re-verify): R-005 forbids `===` against quoted strings. In `apps/playground/src/App.tsx`: `gesture.kind === "move"|"resize"|"draw"|"press"` (about lines 236-454) and `schema.control === "text"|"number"|"toggle"|"select"` (about lines 1343-1390). The naming lint only scans `packages/`, so nothing flags these.
Rule: R-005, R-007.
Steps: if a registry for these values already exists in code, use it. If not, STOP and ask where the new registry belongs (do not choose a package yourself). No behavior change; no test edits.
Exit criteria: no `=== "…"`, `!== "…"` or `case "…"` against a quoted string remains in `apps/playground/src` (show the grep returning nothing); `pnpm check` passes; the playground builds.

---

## PHASE H — Launch hygiene

### H1 — Root files and doc truth · branch `docs/launch-hygiene`

1. `git mv docs/AGENTS.md AGENTS.md` (repo root). Fix `@opendraw/` to `@open-draw/` inside it. Update any path reference to the old location (search the repo; list every hit).
2. Create root `README.md`. It is a DRAFT for the owner to approve. Contents: one-sentence description; one honest "Alpha" line; the 4 to 6 features that exist AFTER phase F is merged (write it last, from real behavior); exact install and run commands that you ran yourself (`pnpm install`, `pnpm dev`); a Limitations list that includes at least: SDK packages not published (ruling V5), no change-notification events (ruling V7), no text shape kind, no grouping; license line copied from `LICENSE`. No claim the code cannot back, no comparison to other tools, no marketing words.
3. `docs/about/readme.md`: do not rewrite. Produce a list in the PR of every statement that disagrees with the code (known: old command names `ResizeShape`, `DeleteShapes`, `UpdateShapeProperties`, `AssignProfile`, `AssignSemanticType`, `ReparentShapes`; the "current status" section; the milestone list). Wait for the owner's answer for each before editing.
4. `docs/architecture/overview.md` and `docs/contracts/document-model.md` are 0 bytes. Report them. Do not fill them. The owner decides: delete or write.

Exit criteria: root `AGENTS.md` and `README.md` exist; no `@opendraw/` remains outside quoted historical text (grep shown); every command written in the README was run by you and the output shown; `pnpm check` passes.

### H2 — Split oversize files · branch `refactor/split-oversize-files`

Rule: R-010. Targets: `apps/playground/src/App.tsx` (about 1,564 lines), `packages/document/src/validation.ts` (316 lines).
Steps: send the owner the proposed split (new file names, one line each, what moves where) and wait for "approved". Then move code only: no renames, no logic edits, no public export changes.
Exit criteria: no source file over about 300 lines (show the line-count command output); `pnpm check` passes; the playground builds; you list the manual playground steps you ran (draw, move, resize, undo, save, load) with a headless-browser screenshot after each, saved outside the repo.

---

## PHASE F — Minimum features (BLOCKED until ruling V2 and ADR-0006 are done)

### F0 — Draft ADR-0006 "v1 feature scope" · branch `docs/adr-0006-v1-features` · NEEDS RULING V2

Status must be **Proposed**. You write options; you decide nothing. One ADR covering F1 to F5, each with: what changes, which packages and files, what the stored data looks like, what happens to older documents, which rules it implements, and at least two options where a real choice exists. End with a numbered question list for the owner.
Exit criteria: the ADR file exists, status Proposed, every F-task below has a section, no code changed. Work on F1 starts only after the owner writes "RATIFIED: ADR-0006".

### F1 — Shape colors · branch `feat/shape-colors` · NEEDS RULING V3

Behavior: a shape can have an optional fill, stroke color and stroke width. Set from the playground inspector. Undo and redo work. Save, load and export keep them.
Boundaries: `contracts` (types, registries), `document` (field validation and a typed command following the existing command-folder pattern, R-012), `renderer-svg` (draw them, escaped with `escapeXml`), playground (inspector controls). Color values are validated at load against a strict pattern (R-006): a bad value throws a typed error. Crayon style keeps working (R-021: styles never change geometry). No new dependency.
Exit criteria:

- Tests: a document saved before the change loads and renders the same SVG as before (byte-identical); a hostile color string is rejected at load; set, undo and redo round-trip; Markdown export output does not change (colors are not exported, ADR-0005 D2).
- Headless-browser screenshots: three shapes with different colors, before and after undo.
- `pnpm check` passes.

### F2 — Visible text on shapes · branch `feat/visible-shape-text` · NEEDS RULING V4

Behavior (default ruling): the shape's existing `label` is drawn inside the shape, centered, escaped, clipped to the shape box so it never overflows. Edited from the playground inspector (already present).
Boundaries: `renderer-svg` and playground only, unless the ruling says otherwise. No new stored field under the default ruling (R-042: labels are human text, ids are for machines). Hostile and very long labels must not break the SVG.
Exit criteria: tests for hostile label (`<`, `&`, quotes), a 2,000-character label, and a one-character label; text never extends past the shape box (assert via the generated clip); old documents render the same except that labels now appear; `pnpm check` passes; screenshot attached.

### F3 — Multi-select · branch `feat/multi-select`

Behavior: shift-click adds or removes a shape from the selection; dragging on empty canvas draws a selection box that selects the shapes it touches; moving and deleting act on every selected shape as ONE history step (R-018); Escape clears. Resize applies only when exactly one shape is selected.
Evidence to re-verify first: `COMMANDS.moveShapes` already takes several shapes, and `packages/document/src/reparent.ts` already prunes multi-selection. The single-selection limit lives in `packages/canvas/src/selection.ts` (`Selection`, `selectOne`, `singleSelected`) and the pure state machine.
Boundaries: `canvas` (selection, hit-test, pure state machine as a transition table, R-009), `input` (named actions only, R-011), playground (shell). Keep the machine a pure table. Shapes that are not selectable (virtual root) stay unselectable.
Exit criteria: pure tests for selection add/remove/clear/box-select; machine tests for the new transitions; a test that moving three shapes then pressing undo once restores all three; single-selection behavior unchanged (existing tests pass unedited); screenshots of box-select, shift-select and a three-shape move; `pnpm check` passes.

### F4 — Image export with legend · branch `feat/export-image-with-legend` · NEEDS RULING V8

Behavior: playground buttons "Export SVG" and "Export PNG". Tag chips show at each tagged shape's top-left corner (the chip drawing already exists in `renderer-svg`). A "Show legend" checkbox, OFF by default, adds a legend listing ONLY the tags actually used in the document, once each. Chips and legend are presentation only and never stored (R-031).
Boundaries: the legend is a pure function in `renderer-svg` that takes already-resolved plain data (a list of label strings). The playground shell builds that list using `semantics`. Do NOT make `renderer-svg` import `semantics` or `profiles`; if you believe you must, STOP and ask. PNG conversion happens only in the playground (browser canvas `toBlob`), with no new dependency. Everything is escaped with `escapeXml`. Export is a snapshot and changes nothing in the document.
Exit criteria: tests for the legend function (no tags = no legend; duplicates listed once; hostile tag text escaped; stable output order); the exported SVG parses as XML; a PNG file is produced in a headless browser and its pixel size matches the drawn content (report the numbers); legend off by default (test or screenshot); `pnpm check` passes; screenshots of SVG and PNG with legend on and off.

### F5 — Duplicate and copy/paste · branch `feat/duplicate-and-paste` · STRETCH (only if V2 includes it)

Behavior: Ctrl/Cmd+D duplicates the selection offset by a fixed distance; copy and paste within the same document, as one history step. New shapes get new valid ids. Children come with their parent and keep their structure.
Boundaries: a typed command in `document` (command-folder pattern), named actions in `input`, playground wiring. Platform and style are stored on roots only (R-026): a pasted child never gets its own. Do not use the system clipboard in v1.
Exit criteria: duplicating a root with nested children yields no duplicate ids and passes document validation; one undo removes everything pasted; `pnpm check` passes; screenshot.

---

## PHASE L — Launch gate (agent verifies and reports; owner decides and launches)

Run on a fresh clone of `main` in an empty directory. For each item report PASS or FAIL with the command output as evidence:

1. `pnpm install --frozen-lockfile && pnpm check` passes.
2. `pnpm dev` starts and the playground works in a headless browser: draw, color, label, multi-select, undo, save, load, export Markdown, export SVG, export PNG. One screenshot per step.
3. Every sentence in `README.md` is true. Quote each feature claim next to the test or screenshot that proves it.
4. No broken internal links in any `.md` file (list the check you ran).
5. Safety re-test: the hostile Markdown test and the over-depth test from S1 and S2 are in the test suite and pass.
6. Pages: the release workflow's build commands run successfully when executed locally; the owner cuts the tag, never the agent.
7. List every open item that remains (empty docs, stale blueprint statements, R-019 events, packaging). Nothing hidden.

The agent does not tag, publish, post, or write the launch post. It does not state that the project is "ready". It reports the checklist.

## Not allowed in this milestone

New shapes, tools, platforms or styles; grouping; snapping; layers panel; npm publishing; renaming public APIs; deleting or weakening tests; editing `RULES.md` or any Accepted ADR; touching `.github/workflows`; tagging or releasing.
