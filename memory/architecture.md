# Architecture & Design Principles

## Core Architectural Convictions

### 1. DOM Canvas (The Soul of the Project)
- **Every shape is a real DOM/SVG element** inside one root `<svg>` — never a `<canvas>` bitmap.
- **The Overlay Invariant:** Overlays (labels, tags, chips) are DOM children of the shape's SVG group (`getOverlaySlot` seam). Because they inherit the canvas root transform directly, they *cannot* detach from their shape at any zoom ($0.2\times$ to $5\times$) or during hard pans. Tested to $\pm 1\text{px}$ accuracy.
- **Single Source of Truth for Coordinates:** All screen $\leftrightarrow$ page coordinate math lives exclusively in `camera.ts`. No other file in the codebase multiplies by zoom.

### 2. Five-Package Decomposition
- **`@open-draw/schema`**: Zero-dependency structural types and pure geometry algorithms. Bridges `canvas` and `semantics` without them importing each other.
- **`@open-draw/canvas`**: DOM Canvas rendering engine. Contains zero hardcoded shapes; built-ins and custom shapes register via `registerShape(def: ShapeDefinition)`.
- **`@open-draw/semantics`**: Semantic annotation, platform profiles, responsive derivations. Consumes plain JSON snapshots. DOM-free, canvas-free, runs in Node.
- **`@open-draw/markdown`**: Deterministic compiler producing frozen markdown specifications for AI agents. Pinned byte-for-byte by golden fixtures.
- **`@open-draw/studio`**: Pure composition shell in React. Zero business logic.

### 3. Five Frozen Extensibility Seams
1. **Opaque `meta` bag per shape:** Persisted and diffed by canvas; read and written by semantics/host.
2. **Shape Registry (`registerShape`):** Unified contract for built-in and external shape plugins.
3. **Diff Events on Port (`listen`):** Enables CRDT/collab, history UI, autosave.
4. **`applyLayout(patch)` + `hidden` flag + Z-Order Ops:** Swaps layouts (200 shapes $< 50\text{ms}$) while keeping overlays glued.
5. **Injectable Store:** Enables headless test replay, persistence, and fixture harnesses.

### 4. Grouping vs. Semantic Parenting (Strict Naming Rule)
- **Canvas `group`** (`memberIds`, absolute coordinates, geometric transform container) $\ne$ **Semantic parent** (containment + `parentOverride` in `meta`).
- They must never share field names or APIs. Studio inspector displays semantic parents, not canvas groups (unless they coincide).

### 5. Responsive Ruling
- **"The canvas never learns the word 'breakpoint'."**
- Responsive layout is a pure derivation in `@open-draw/semantics`: `derive(scene, breakpoint) \to DerivedScene`. Canvas only renders the layout patch provided to it.
- **Visual z-order** (canvas command) and **responsive flow-order** (`order` property) are independent and never touch.

### 6. Non-Negotiable Engineering Rules
- **Zero Runtime Dependencies:** `dependencies: {}` enforced in CI across all packages.
- **No Invention:** Unspecified requirements are logged in `docs/od-questions.md` and marked `// OD-QUESTION:`.
- **File & Class Limits:** TS strict (no `any`/`@ts-ignore`), max 500 lines per file, max 300 lines per class.
- **Professional UI Aesthetics (Zero Emojis):** Strictly no unicode emojis in the UI. Always use Google Material Symbols with appropriate semantic glyphs for professional, developer-grade appearance.

