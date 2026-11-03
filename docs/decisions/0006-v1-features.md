# ADR-0006 — v1 Feature Scope & Specifications

- **Status:** Proposed
- **Date:** 2026-11-03
- **Deciders:** Chandra (Owner), Antigravity Agent
- **Rules implemented:** R-002, R-005, R-006, R-007, R-008, R-009, R-010, R-011, R-012, R-014, R-016, R-018, R-021, R-022, R-024, R-026, R-031, R-039, R-041, R-042

---

## Context

OpenDraw has reached Phase F (Minimum Features) of Milestone 08.
Before implementing user-facing features, all functional boundaries, stored schemas, backward-compatibility guarantees, and architecture invariants must be specified in this ADR and ratified by the project owner (Ruling V2).

This ADR specifies 6 feature capabilities:

1. **Edge Resizing (`n`, `s`, `e`, `w` handles)** (User Requested)
2. **F1 — Shape Colors (fill, stroke color, stroke width)** (Ruling V3)
3. **F2 — Visible Text on Shapes** (Ruling V4)
4. **F3 — Multi-Select (shift-click, marquee box, batch move & delete)**
5. **F4 — Image Export with Legend (SVG & PNG)** (Ruling V8)
6. **F5 — Duplicate & Copy/Paste (Stretch)**

---

## Specification by Feature

### 1. Edge Resizing Handles (`n`, `s`, `e`, `w`)

#### Problem

Currently, shapes in `@open-draw/canvas` only expose vertex resize handles (`nw`, `ne`, `se`, `sw`). Users cannot resize width-only or height-only from edge midpoints.

#### Changes & Packages

- `@open-draw/canvas`:
  - Extend `HANDLES` registry in `src/handles.ts` to include edge handles:
    ```ts
    export const HANDLES = {
      nw: "nw",
      n: "n",
      ne: "ne",
      e: "e",
      se: "se",
      s: "s",
      sw: "sw",
      w: "w",
    } as const;
    export type HandleId = keyof typeof HANDLES;
    ```
  - Update `resizeBox` in `src/geometry.ts` to support 1D edge constraints:
    - `n`: adjusts `minY`, preserves `minX`, `maxX`
    - `s`: adjusts `maxY`, preserves `minX`, `maxX`
    - `w`: adjusts `minX`, preserves `minY`, `maxY`
    - `e`: adjusts `maxX`, preserves `minY`, `maxY`
  - Update `pickHandle` in `src/hit-test.ts` to test edge midpoint handles in screen space with `HANDLE_PICK_RADIUS_PX`.
- `@open-draw/renderer-svg` / `apps/playground`:
  - Render edge handle squares at `(midX, minY)`, `(midX, maxY)`, `(minX, midY)`, `(maxX, midY)` in selection overlays.

#### Stored Data & Backward Compatibility

- **Zero changes** to stored document schema. Handles are transient canvas presentation/interaction state (R-016).
- 100% backward compatible with existing documents.

#### Options

- **Option A (Recommended):** Support all 8 handles (`nw`, `n`, `ne`, `e`, `se`, `s`, `sw`, `w`) for all resizable 2D shapes (`rect`, `ellipse`).
- **Option B:** Support 8 handles for `rect`, but restrict `ellipse` to 4 corner handles only.

---

### 2. F1 — Shape Colors (Fill, Stroke Color, Stroke Width)

#### Problem

Shapes currently render with hardcoded black stroke and transparent/white fill. Users cannot visually distinguish shapes using colors or stroke weights.

#### Changes & Packages

- `@open-draw/contracts`:
  - Define `ColorValue` type and validation regex/pattern (strict hex `#RGB`, `#RRGGBB`, `#RRGGBBAA`, or `"none"` / `"transparent"`).
  - Define `STROKE_WIDTHS` range or default constants (`DEFAULT_STROKE = "#000000"`, `DEFAULT_FILL = "none"`, `DEFAULT_STROKE_WIDTH = 1`).
- `@open-draw/document`:
  - Extend `Shape` interface with optional fields:
    ```ts
    readonly fill?: string | null;
    readonly stroke?: string | null;
    readonly strokeWidth?: number | null;
    ```
  - Add typed command `packages/document/src/commands/set-shape-style/index.ts` (R-012 uniform command layout):
    ```ts
    export interface SetShapeStyleCommand {
      readonly type: typeof COMMANDS.setShapeStyle;
      readonly id: ShapeId;
      readonly fill?: string | null;
      readonly stroke?: string | null;
      readonly strokeWidth?: number | null;
    }
    ```
  - Validate color values loudly in `packages/document/src/validation.ts` (R-006): invalid hex strings or negative stroke widths throw typed `DocumentError(DocumentErrorCode.INVALID_SHAPE_PROPERTY)`.
- `@open-draw/renderer-svg`:
  - Render `fill`, `stroke`, `stroke-width` attributes on SVG elements, sanitized via `escapeXml`.
  - In `crayon` / hand-drawn style, pass stroke color and width to wobbled paths.
- `@open-draw/export-markdown`:
  - Invariant: Colors are visual styling, **not** semantic data (ADR-0005 D2). Markdown export ignores colors and remains 100% byte-identical.
- `apps/playground`:
  - Color pickers and stroke width selector in `ShapeInspector.tsx`.

#### Stored Data & Backward Compatibility

- Serialized JSON:
  ```json
  {
    "id": "rect-1",
    "kind": "rect",
    "x": 100,
    "y": 100,
    "width": 200,
    "height": 100,
    "fill": "#e0f2fe",
    "stroke": "#0284c7",
    "strokeWidth": 2
  }
  ```
- Omitted fields default cleanly to baseline wireframe (`fill = "none"`, `stroke = "#000000"`, `strokeWidth = 1`).
- 100% backward compatible: older documents without color fields load and render byte-identically to before.

#### Options

- **Option A (Recommended):** Flat optional properties on `Shape` (`shape.fill`, `shape.stroke`, `shape.strokeWidth`). Simple, zero nesting overhead, clean validation.
- **Option B:** Nested `shape.style?: { fill?: string; stroke?: string; strokeWidth?: number }`. Matches CSS-like grouping, but adds nesting and null-check layers.

---

### 3. F2 — Visible Text on Shapes

#### Problem

The document model stores `shape.label` (R-042), but canvas and SVG rendering currently do not draw the label visibly inside the shape.

#### Changes & Packages

- `@open-draw/renderer-svg`:
  - In `documentToSvg`, when `shape.label` is present and non-empty:
    - Render `<clipPath id="clip-{shape.id}">` matching the shape's bounding box.
    - Render `<text>` centered at `(x + width/2, y + height/2)` with `dominant-baseline="central"`, `text-anchor="middle"`, system sans-serif font, escaped via `escapeXml`.
    - Apply `clip-path="url(#clip-{shape.id})"` so oversized text never bleeds outside shape bounds.
  - Very long or hostile text (`<script>`, `&`, quotes) is XML-escaped and clipped safely without distortion.
- `apps/playground`:
  - Shape label is already editable in `Inspector.tsx` / `ShapeInspector.tsx` and immediately rerenders.

#### Stored Data & Backward Compatibility

- **Zero changes** to stored document format! Uses the existing `shape.label` field (R-042: labels describe for humans; ids identify for machines).
- Documents without labels render unchanged. Documents with labels now display their human label.

#### Options

- **Option A (Recommended / Default Ruling V4):** Use existing `shape.label`, rendered centered and clipped inside the shape geometry. Zero schema changes.
- **Option B:** Create a new standalone shape kind `text` with font size, text alignment, and bounding box. (Requires new shape package, schema changes, and wider contracts).

---

### 4. F3 — Multi-Select (Shift-Click, Marquee Box, Batch Actions)

#### Problem

Currently, `@open-draw/canvas` only allows selecting a single shape at a time. Users cannot select multiple shapes to move or delete together.

#### Changes & Packages

- `@open-draw/canvas`:
  - `packages/canvas/src/selection.ts`:
    - Refactor `Selection` state from single `ShapeId | null` to `readonly ShapeId[]` (set of unique selected ids).
    - Provide `toggleSelection(current, id)`, `selectMany(ids)`, `clearSelection()`.
  - `packages/canvas/src/machine.ts`:
    - Add `selecting` state (or `marquee`) to transition table (R-009).
    - Pointer down on empty canvas with select tool starts marquee box gesture.
    - Shift + pointer down on a shape toggles that shape in the selection set without clearing others.
  - `packages/canvas/src/hit-test.ts`:
    - Add `boxIntersectsBox(a, b)` for marquee intersection testing.
- `@open-draw/input`:
  - Ensure named actions map `Escape` to `ACTIONS.cancel` (clears selection), and `Delete`/`Backspace` to `ACTIONS.deleteSelected` acting on all selected shapes.
- `apps/playground`:
  - Move gesture moves all selected shapes together as **one single history transaction** (R-018: commit-boundary events only).
  - Delete deletes all selected shapes as **one single history transaction**.
  - Resize handle is only shown and active when exactly one shape is selected.

#### Stored Data & Backward Compatibility

- **Zero changes** to stored document schema. Selection is transient canvas interaction state (R-016).
- 100% backward compatible.

#### Options

- **Option A (Recommended):** Marquee uses **bounding box intersection** (any shape whose bounding box touches or overlaps the marquee rectangle is selected). Standard in Figma / tldraw / Miro.
- **Option B:** Marquee uses **strict containment** (only shapes whose bounding box is 100% inside the marquee rectangle are selected).

---

### 5. F4 — Image Export with Legend (SVG & PNG)

#### Problem

Users can currently export to JSON and Markdown, but cannot export visual SVG or PNG images for documentation, presentations, or sharing.

#### Changes & Packages

- `@open-draw/renderer-svg`:
  - Pure function `documentToSvgWithLegend(doc, options)`:
    - Pure data options: `readonly legendItems: readonly { label: string; tag: string }[]`.
    - If `legendItems` is non-empty, appends a neat legend box at the bottom-left or bottom margin of the SVG.
    - All legend text escaped via `escapeXml`.
    - **Crucial Boundary Guard (ADR-0005, AGENTS.md section 5):** `renderer-svg` does NOT import `semantics` or `profiles`. Plain legend labels are computed by the caller (playground) and passed as plain string data.
- `apps/playground`:
  - Top toolbar buttons:
    - "Export SVG" (downloads `.svg` file via Blob).
    - "Export PNG" (renders SVG into HTML5 `<canvas>` via `Image` and downloads `.png` using `toBlob`).
  - Toolbar checkbox: "Include Legend" (default unchecked / OFF). When checked, queries `semantics` to extract the unique list of active semantic tags in the document.
  - Zero new third-party dependencies (R-002: native browser Canvas API for PNG generation).

#### Stored Data & Backward Compatibility

- **Zero changes** to stored document schema. Export is a pure snapshot projection (R-016, R-031).
- 100% backward compatible.

#### Options

- **Option A (Recommended):** Legend box is placed below the scene bounding box with extra padding, expanding the exported SVG `viewBox` cleanly so no shapes are obscured.
- **Option B:** Legend is pinned to a fixed corner (e.g. bottom-right) inside the scene bounding box.

---

### 6. F5 — Duplicate & Copy/Paste (Stretch)

#### Problem

Creating repeated shapes requires drawing each one from scratch. Users cannot duplicate or copy/paste existing shapes with their hierarchies and labels.

#### Changes & Packages

- `@open-draw/document`:
  - Add typed command `packages/document/src/commands/duplicate-shapes/index.ts` (R-012 uniform command layout):
    - Takes `readonly ShapeId[]` and offset `Point` (e.g. `+20, +20`).
    - Clones shapes, assigns fresh valid `ShapeId`s (`nextShapeId()`), maps parent-child references consistently within the duplicated subtree.
    - If a root is duplicated, its platform and style are preserved on the new root (R-026).
- `@open-draw/input`:
  - Add `ACTIONS.duplicate` mapped to `Mod+D` (`Ctrl+D` / `Cmd+D`).
- `apps/playground`:
  - In-memory clipboard array of cloned shapes for copy (`Mod+C`) and paste (`Mod+V`).
  - Executed as a single undoable transaction (R-018).

#### Stored Data & Backward Compatibility

- Standard shapes created; zero schema changes.
- 100% backward compatible.

#### Options

- **Option A (Recommended):** In-memory application clipboard. Zero browser permission prompts, synchronous, zero dependency, works across all environments.
- **Option B:** System clipboard (`navigator.clipboard.writeText / readText`). Requires browser async permissions and complex clipboard security prompts.

---

## Decision Inventory & Questions for Owner Review

Please review and confirm each of the following decisions:

1. **Edge Resizing:** Confirm **Option A** (8 handles: `nw`, `n`, `ne`, `e`, `se`, `s`, `sw`, `w` for all resizable shapes)?
2. **F1 (Shape Colors):** Confirm **Option A** (flat optional `fill`, `stroke`, `strokeWidth` on `Shape`)?
3. **F2 (Visible Text):** Confirm **Option A** (render existing `shape.label` centered and clipped inside the shape; zero new stored schema)?
4. **F3 (Multi-Select):** Confirm **Option A** (marquee selects by bounding box intersection)?
5. **F4 (Image Export):** Confirm **Option A** (SVG & PNG export buttons; optional legend expands viewBox at bottom)?
6. **F5 (Duplicate / Copy-Paste):** Confirm **Option A** (in-memory clipboard, `Mod+D` duplicate, `Mod+C` / `Mod+V`) as stretch goal?

When ready, reply with **"RATIFIED: ADR-0006"** (along with any specific option choices or adjustments) to begin implementation of Phase F.
