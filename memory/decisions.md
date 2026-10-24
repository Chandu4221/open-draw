# Technical Decisions (ADRs)

## Official Project ADRs (to be committed to `docs/adr/`)

### ADR-001: Rendering — DOM Canvas Engine
- **Status**: Accepted
- **Context**: Drawing tools historically use HTML5 `<canvas>` bitmaps or DOM/SVG trees. Predecessor attempts failed 6 times due to transform desynchronization when rendering interactive DOM overlays (tags, chips, labels) over a `<canvas>` bitmap during fast pans and deep zooms ($0.2\times$ to $5\times$).
- **Decision**: Implement a **DOM Canvas** where every shape is a real DOM/SVG element inside one root `<svg>`. Overlays are DOM children of shape wrapper groups (`getOverlaySlot` seam). Single camera transform on root group.
- **Consequences**: Flawless transform coherence (overlays physically cannot detach from shapes). Native browser hit-testing and accessibility. Bitmap `<canvas>` explicitly forbidden in the render pipeline (verified via CI grep for `getContext`).

### ADR-002: Parenting — Explicit Storage with Geometric Drop-Time Suggestion
- **Status**: Accepted
- **Context**: Automatic continuous geometric recomputation of parenting causes fragile layout jumps and jitter during drag operations.
- **Decision**: Stored explicit parent in `meta` (managed by semantics/host) is the source of truth. Geometric containment is a drop-time suggestion only (innermost-frame-wins tie-breaker). Validity events fire on parent move/delete. No continuous recompute in v0.x.
- **Consequences**: Deterministic, stable tree hierarchy without runtime parenting thrashing.

### ADR-003: Grouping — Absolute Coordinates & Selection Containers
- **Status**: Accepted
- **Context**: Hierarchical transform trees complicate serialization, coordinate translation, and nested hit testing.
- **Decision**: Groups are selection sets and transform operators. Group members store **absolute coordinates** (no local transform tree). Schema permits N-level nesting, but v0.x UI exposes one level. Canvas `group` (`memberIds`) $\ne$ semantic parent (`meta.parentOverride`).
- **Consequences**: Simple, robust math; no cumulative rounding errors; strict separation between visual grouping and semantic hierarchy.

### ADR-004: Responsive — Derivation, Never Canvas Rendering State
- **Status**: Accepted
- **Context**: Embedding responsive logic into the drawing canvas creates bloated, opinionated rendering loops.
- **Decision**: The canvas never learns the word "breakpoint". Responsive layouts are pure derivations in `@open-draw/semantics`: `derive(scene, breakpoint) -> DerivedScene`. Canvas only renders the resulting patch via `applyLayout` and respects a per-shape `hidden` flag. Previews are transient and read-only in v0.x.
- **Consequences**: Canvas stays completely unopinionated; responsive logic is 100% unit-testable in bare Node with golden fixtures.

### ADR-005: Addition of `@open-draw/schema` Foundation Package
- **Status**: Accepted
- **Context**: To keep `@open-draw/canvas` and `@open-draw/semantics` completely independent without circular or direct dependencies, shared types and geometric algorithms needed a home.
- **Decision**: Introduce `@open-draw/schema` as the zero-dependency base package containing `ShapeId`, `Bounds`, shape snapshots, and pure geometry utilities (`boundsContain`, intersection).
- **Consequences**: Both `canvas` and `semantics` depend only on `schema`. Neither depends on each other.

### ADR-006: Unified Compile-Time Shape Registry
- **Status**: Accepted
- **Context**: Hardcoding shapes in canvas core limits extensibility and couples tools with shape implementations.
- **Decision**: Canvas core contains zero hardcoded shapes. All shapes (built-in and custom) register via `registerShape(def: ShapeDefinition)`.
- **Consequences**: Modular shape plugins; CI enforces zero shape-type switching outside shape modules.

### ADR-007: Professional UI Aesthetics — Zero Emojis, Google Material Symbols Only
- **Status**: Accepted
- **Context**: Unicode emojis render as brightly colored, OS-dependent toy icons (e.g. yellow cartoon folders, targets, clipboards) which undermine the professional, polished developer-tool appearance of OpenDraw.
- **Decision**: Strictly zero emojis anywhere in the user interface. Use Google Material Symbols (`<span class="material-symbols-outlined">...</span>`) with appropriate, professional glyphs (`folder`, `folder_open`, `crop_square`, `title`, `center_focus_strong`, `content_copy`, `chevron_right`, `expand_more`, etc.).
- **Consequences**: Consistent, clean, monochrome enterprise-grade UI styling across all browsers, operating systems, and inspector tabs.

