# Agent Execution Instructions — Milestone 02b (Minimal Working Canvas)

You are executing a **fully specified, pre-reviewed** implementation plan. Your job is
transcription, not design. Every decision in this milestone has already been made and
ratified by the project owner; three independent adversarial review passes have cleaned
the plan of defects.

---

## 1. Source of truth

- **Plan:** `docs/plans/milestone-02b-minimal-working-canvas.md` (revision containing
  review rounds 1–3 — verify the plan contains `SetShapeBoundingBox` naming, the
  tool-priority machine ordering, `parseShapeId("page-1")`, and the in-place `.map()`
  in BOTH `MoveShapes` and `SetShapeBoundingBox` before you start; if any of these are
  missing, STOP and report a stale plan file instead of proceeding).
- **Rules:** `docs/rules/RULES.md` — read before touching anything. You must be able to
  quote the rule behind every action (R-043 review gate).

## 2. Binding constraints (quoted rules)

- **R-038 — No invention.** If anything in the plan is ambiguous or appears wrong, do
  NOT fix or improvise. Report it back and wait. A silent judgment call is a violation.
- **R-043 — Agent delegation protocol.** You ship: a decision inventory (any judgment
  you made), quoted rules per file, exact verification commands and their output.
- **R-032 — Branch:** `feat/minimal-canvas`, short-lived, deleted after merge.
- **R-033 — Commit titles:** conventional vocabulary exactly as listed in §4.
- **R-034 — main is always green.** Never commit directly to main. Never force-push.
- **R-002/R-020 — Zero runtime deps, enforced boundaries.** Do not add dependencies.

## 3. Hard prohibitions

1. Do not modify any file content from the plan — paste **verbatim**, byte for byte.
2. Do not "improve" formatting, naming, comments, or structure (prettier handles format).
3. Do not add, rename, or delete files beyond the file tree in the plan.
4. Do not commit to `main`.
5. If `pnpm check` fails: report the full error output. Do NOT fix code to make it pass
   unless the fix is a pure formatting issue caught by `format:check` — in that case run
   `pnpm format` on the affected files only. All other failures are plan defects:
   report, do not repair (drift protocol: flag first).

## 4. Procedure

```bash
git checkout main && git pull
git checkout -b feat/minimal-canvas
```

**Commit 1** — `docs: append R-039...R-043 (naming, device types, schema, delegation)`

- `docs/rules/RULES.md` — full replacement from the RULES draft the owner provides.
  This is the ONLY file whose content comes from outside the plan document.

**Commit 2** — `feat: add MoveShapes and SetShapeBoundingBox commands`

- `packages/document/src/commands/registry.ts` (modify)
- `packages/document/src/commands/index.ts` (modify)
- `packages/document/src/transactions.ts` (modify — imports + two switch cases only)
- `packages/document/src/commands/move-shapes/index.ts` (new)
- `packages/document/src/commands/set-shape-bounding-box/index.ts` (new)
- `packages/document/src/transactions.test.ts` (add the two cases from the plan)

**Commit 3** — `feat: add canvas interaction core and svg renderer`

- Everything under `packages/canvas/` and `packages/renderer-svg/` (new packages,
  including their `package.json`, `tsconfig.json`, and all `src/` files and tests,
  exactly as specified in the plan)
- `apps/playground/package.json` (add the four workspace dependencies only)

**Commit 4** — `feat: playground canvas shell (draw, select, move, resize, pan, zoom)`

- `apps/playground/src/App.tsx` (full replacement)

**Verification (R-043 item 3) — run and capture output:**

```bash
pnpm install
pnpm check
```

`pnpm check` must be fully green before you proceed to hand-off. If it is not, §3
applies.

## 5. Definition of done (agent side)

- All files from the plan exist with verbatim contents, on `feat/minimal-canvas`, in
  the four commits above.
- `pnpm check` green (format + lint + typecheck + test + build).

## 6. Human hand-off (do NOT do these yourself)

The owner performs, in order:

1. **Hand-test gate** (`pnpm --filter playground dev`) — the 8-point checklist at the
   bottom of the plan: draw rect/ellipse inside pages AND on empty canvas, tool-active
   press inside a page draws (never drags the page), pointer-down selects, click-empty
   clears, drag moves with preview then one-step undo, resize anchors opposite edges,
   wheel zoom at cursor 0.1×–10×, Space/middle-drag pans, moved shapes keep z-order.
2. PR creation with the plan's PR title/body line.
3. Squash-merge after CI green (R-034/R-037), then delete `feat/minimal-canvas` AND the
   stale `feat/document-core` branch (R-032).

## 7. Report format (your deliverable back to the owner)

1. **Decision inventory:** every judgment you made. For a pure transcription task this
   should read "none"; list anything that forced a choice (e.g. a formatting fix).
2. **Files written:** the full list, matched against the plan's file tree.
3. **Verification output:** the tail of `pnpm check` (or the full failure output).
4. **Deviations:** none expected. Any deviation = a defect report, not a silent change.
