# OpenDraw Phase 2.y — Selection & Handles
# — Agent Instructions —

**Repo:** `github.com/Chandu4221/open-draw` · **Branch:** `build/phase-2y` → merge to `main` on exit
**Prerequisites:** `OPENDRAW.md`, `project-context/OPENDRAW-CONTEXT.md`, ADR-001…005, Phase 2 & 2.x REPORTs (store/camera/registry/8 shapes/3 capabilities/invariant all green)
**Terminology (binding):** DOM Canvas — shapes are real SVG/DOM elements; zero `getContext` in render paths.

**Rules in force:** small commits (`type(scope): what (phase.2y.N)`) · TS strict, no `any`/`@ts-ignore` · **no file > 300 lines**, class ≤200, fn ≤50 · editor = composition point, never accumulator · unspecified → `docs/od-questions.md`, never invention · every guardrail gets a red/green proof · perf = observations until measured.

---

## §0. CLEANUP FIRST (housekeeping from the 2.x audit — opening commits)

1. Delete stale `packages/canvas/src/shapes/rect.ts` and `group.ts` if they're leftovers duplicating the `rect/` and `group/` directories (verify nothing imports them first; if something does, re-point the import, don't delete blindly).
2. Resolve the `store.ts` vs `store/` directory duplication in `packages/canvas/src/` — one home for the store, consistent imports.
3. `memory/progress.md` says next phase is "Phase 3: Semantics" — **outdated.** Update it: next is Phase 2.y (this phase), then SDK freeze, then semantics. Also update `memory/` files to reference `project-context/OPENDRAW-CONTEXT.md` as the master context (read it first).

## §1. SELECTION MODEL

1. `editor.selection: ShapeId[]` (ordered by pick, capped at some sane max — TBD in questions doc if hit-testing perf demands).
2. **Click** = select single; **click empty** = clear; **Shift+click** = toggle in/out; **marquee (drag on empty space)** = select shapes intersecting the marquee rect (`boundsIntersect` from schema); Shift+marquee = add to selection.
3. **Group selection:** clicking a group member selects the group (one level, per v0.x UI); Shift+click descends into the member. `Ctrl/Cmd+click` = descend directly (pick the shape under cursor regardless of group).
4. **Keyboard:** `Tab`/`Shift+Tab` cycle selection through shapes in z-order; `Ctrl/Cmd+A` select-all (visible shapes); `Escape` clear; arrow-key focus navigation also moves selection when nothing is being dragged.
5. **Selection visuals:** per-shape selection outline rendered in the shape's **overlay slot** (invariant covers it — glued through pan/zoom automatically). Group selection = union bounds outline + per-member outlines.
6. **E2E gate (`e2e/selection.spec.ts`):** click select → shift-toggle → marquee captures correct set (fixture with partially-overlapping shapes; assert exact id set) → group click selects group, shift descends → Tab cycles in z-order → clear → undo of a *selection change is NOT a store transaction* (selection is view state, not document state — assert undo stack untouched).

## §2. KEYBOARD MODULE (data-driven, not a package)

```
packages/canvas/src/input/
  keymap.ts      — pure data table: { key, mods, command }[] (≤300 lines; adding a shortcut = one row)
  keyboard.ts    — dispatcher: one listener, routes to commands (≤300 lines)
  commands.ts    — command implementations (nudge, delete, duplicate, zorder, tool, zoom, undo/redo)
```

1. **Tool shortcuts:** `V` select, `R` rect, `O` ellipse, `T` text, `F` frame, `N` note, `A` arrow, `D`/`P` ink, `E` eraser, `H` pan, `I` image.
2. **Nudge:** arrows = 1px, Shift+arrows = 10px (screen-space converted to page via camera); **undo-merge:** consecutive same-direction nudges within 500ms merge into ONE undo entry (assert in tests: 5 rapid arrow presses = 1 undo).
3. **Delete/Backspace** = delete selection (one transaction; children of frames orphan per ADR-002 events; arrows unbind per connector capability).
4. **Clipboard:** `Ctrl/Cmd+C/X/V` internal JSON format (schema Snapshot of selected shapes); paste offsets +10,+10 so pasted shapes don't perfectly overlap; `Ctrl/Cmd+D` duplicate (same offset). External clipboard (real OS clipboard) = stretch; internal-first, log in questions doc.
5. **Undo/redo:** `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` and `Ctrl/Cmd+Y`.
6. **Zoom:** `Ctrl/Cmd+0` reset, `Shift+1` fit-to-content, `Shift+2` zoom-to-selection (camera math via camera.ts ONLY — fence).
7. **Editing mode suspends shortcuts:** while `editor.mode === 'editing'`, ONLY Escape/commit apply (text editing owns the keyboard). Capability-scoped, not a type check.
8. **`Ctrl|Cmd` abstraction:** one `isMod(e)` utility; no scattered `e.ctrlKey || e.metaKey`.
9. **Host escape hatch:** `createEditor({ keymap })` accepts a custom/filtered table (hosts must be able to stop `Ctrl+A` hijacking their page). Default table = the above. No user-rebindable UI in v0.x (data-driven internally only).
10. **Keyboard-only golden path E2E (`e2e/keyboard-golden-path.spec.ts` — zero mouse events allowed in this spec):** Tab to a shape → Enter/click-equivalent to select → arrows to move (exact coords) → Shift+arrows 10px → `Ctrl/Cmd+D` duplicate → arrows move the dupe → Delete → `Ctrl/Cmd+Z` restores it → assert store state exact at each step. A11y is real because elements are real; also assert wrappers are focusable (`tabindex`), `role`, `aria-label` (type + name if present).

## §3. THE 8-HANDLE RESIZE SYSTEM (from scratch — no library)

```
packages/canvas/src/selection/
  handles.ts     — handle geometry & hit zones (pure fns, unit-tested)
  resize.ts      — resize math per handle (pure fns, exact-number fixtures)
  rotate.ts      — rotation math
  handlesView.ts — DOM rendering of the handle frame (overlay-slot children)
```

1. **8 handles** (N, NE, E, SE, S, SW, W, NW) + **1 rotate handle** above N. Handles live in a **selection-frame overlay** — glued to the selection's union bounds via the overlay architecture (invariant test extended to the selection frame).
2. **Constant screen size:** handles render at fixed screen px regardless of zoom — the ONE documented counter-scaling exception (decided in the audit round): implemented in `handlesView.ts` only, via `1/camera.zoom` scale on the handle elements; CI note: this is the sole permitted screen-space compensation, documented in code comment + spec. E2E: handles pixel-size equal at 0.5× and 2× (assert getBoundingClientRect widths within ±1px).
3. **Resize math:** pure function per handle — `resize(bounds, handle, dx, dy, {aspect, fromCenter, minW, minH})` in `resize.ts`; **exact-number unit fixtures**: SE +100px → w+100±1; Shift = aspect-lock (from the ORIGINAL aspect at gesture start); Alt = resize from center; min-size clamps (10px page units); W/E handles only change width, N/S only height, corners both (aspect-locked if Shift).
4. **Rotation:** rotate handle drags angle around the SELECTION CENTER (group = union center); snapping to 0/45/90° within 5° unless Shift held (invert: Shift = free rotation) — record choice in questions doc if contested; exact fixtures: rotate rect 90° → rotation=90, bounds recomputed via schema geometry.
5. **Per-shape resize:** each shape's `geometry.resize()` (registry contract) is called with the new bounds; the editor NEVER contains shape-specific resize logic (type-branching fence applies to resize code paths too).
6. **Text shapes:** resize changes the BOUNDS box; text reflows (autogrow) — text's own module handles it.
7. **E2E gate (`e2e/handles.spec.ts`):** select shape → 8 handles + rotate present at expected screen positions (±1px) → drag SE +100px screen → store bounds +100±1 page units (accounting for zoom) → Shift-drag maintains aspect (assert w/h ratio unchanged) → Alt-drag centers → rotate 45° → undo = ONE entry for the whole gesture → handles still constant-size at 0.5×/2× (§3.2).

## §4. Z-ORDER OPERATIONS

1. Store commands: `bringForward/sendBackward/bringToFront/sendToBack(ids)` — z = array order in snapshot (verify current z representation in store; if z is implicit array order, these are reorder ops — implement as such, document).
2. Shortcuts: `Ctrl/Cmd+Shift+]` front, `[` back, `Alt+]` forward one, `Alt+[` backward one (mod-abstraction utility).
3. One transaction per op (or merged per gesture — record choice).
4. E2E: stack 3 overlapping rects → bring front → screenshot → undo → order restored (assert array order exact).

## §5. GESTURE RE-PARENTING (closes Q-002)

1. Drag a shape OUT of its frame past bounds + threshold (12px screen) → detach (explicit action, per ADR-002's "no continuous recompute" — the drag itself IS the explicit gesture) → one transaction.
2. Drop a shape fully inside another frame (containment: TL-inclusive/BR-exclusive) → parent = that frame (smallest-area wins on overlap) → one transaction.
3. Drag between frames (out of A, into B) = single re-parent transaction, not detach+attach (undo restores original parent exactly).
4. E2E (`e2e/reparent.spec.ts`): drag rect from frame A into frame B → `meta.parent` = B, one undo entry → undo → parent = A exact → drag out to empty canvas → parent = none → overlapping-frames fixture → smallest-area wins.

## §6. STROKE ERASER

1. `E` tool: drag over shapes → shapes whose bounds intersect the eraser path are deleted (whole-shape erase; pixel eraser remains out of scope); **live highlight** of would-be-deleted shapes during drag.
2. Delete commits on pointer-up as ONE transaction (all shapes in the gesture).
3. E2E: drag across 3 shapes → all 3 deleted, one undo entry → undo restores all 3 exact → eraser respects frames (erases frame OR its children based on hit target — record exact rule in questions doc).

## §7. PHASE 2.y EXIT GATE

- [x] §0 cleanup done; memory files updated to 2.y-next + master context referenced
- [x] Selection model green (marquee exact-id fixture, group logic, selection ≠ document state)
- [x] Keyboard module live: full shortcut set, nudge undo-merge, editing-mode suspension, keymap injectable; **keyboard-only golden-path E2E green (zero mouse events)**
- [x] 8-handle resize + rotate: exact-number fixtures green, per-shape resize via registry only, constant-size handles proven at 0.5×/2×
- [x] Z-order ops + shortcuts green
- [x] Gesture re-parenting green (Q-002 closed)
- [x] Stroke eraser green
- [x] Overlay-invariant extended to selection frame + handles — green
- [x] All existing guardrails still green (boundaries, deps, bitmap, links, zoom-math, type-branching, file-size); new fences if any new rule added (red/green proof each)
- [x] REPORT.md in `docs/od-verification/2y/` citing every claim; screenshots per feature; questions doc reviewed — every entry answered or scheduled, none silently dropped
- [x] CI green end-to-end; merged to `main`

**Explicitly NOT in Phase 2.y:** styles/theme UI, crayon/sketch style (recorded as post-SDK extension candidate — style layer over the registry render seam), exportPNG, culling, rotation of camera, any semantics/markdown/Studio work, any perf-budget claim.

**After exit:** SDK freeze → `@open-draw/canvas@0.1.0` (README, API docs from ADR-005 + this phase's contracts, exportPNG with chips-on/off option) → hardening 0.2.0 (firefox/webkit, a11y audit, leak tests) → Phase 3 semantics (ADR-006 first).