# ADR-001: Rendering — DOM Canvas Engine

## Status
Accepted

## Context
A whiteboard and wireframing tool requires rendering shapes, handling user interaction (pan, zoom, drag, resize), and supporting semantic overlays (labels, tags, chips, badges).

Historically, drawing applications choose between two primary rendering technologies:
1. **HTML5 `<canvas>` (Bitmap Rendering):** High raw pixel throughput, but renders a flat raster bitmap. Any interactive overlays or DOM tags must be rendered in a separate HTML layer floating above the canvas, tracked via JavaScript coordinate projections.
2. **DOM Canvas (SVG / Retained Mode DOM):** Every shape is a discrete DOM/SVG node retained in the browser's scene graph.

In our predecessor project, the bitmap `<canvas>` approach failed six separate times specifically around overlay transform synchronization. When users performed rapid panning, inertia scrolling, or extreme zooming ($0.2\times$ to $5\times$), the floating overlay layer suffered from frame latency, visual detachment, and rounding jitter. The overlays could not stay glued to their shapes.

## Decision
We choose a **DOM Canvas** architecture:
- Every shape is rendered as a real SVG/DOM element inside a single root `<svg>` element.
- The canvas camera is implemented as a single CSS/SVG `transform` matrix on the root group `<g id="viewport">`.
- **All screen $\leftrightarrow$ page coordinate math is strictly isolated in `camera.ts`**. No other file anywhere in the codebase multiplies by zoom.
- **Overlays are DOM children of the shape's own wrapper group** via the `getOverlaySlot` seam.
- The HTML `<canvas>` bitmap element is **explicitly rejected** and forbidden in the render path. (Grep for `getContext` is enforced with zero tolerance in CI).

*Note on architectural philosophy:* The DOM is the chosen *means*; flawless **transform coherence** is the *requirement*. Because overlays are physical DOM children of the shape group, they inherit the camera transform intrinsically from the browser's native compositing pipeline. They *cannot* physically detach, regardless of zoom level or pan speed.

## Consequences
### Positive
- **Guaranteed Transform Coherence:** Overlays remain glued to shapes ($\pm 1\text{px}$) across all zoom levels ($0.2\times$ to $5\times$) and pans without complex JavaScript synchronization loops.
- **Native Browser Capabilities:** Real DOM elements provide native browser hit-testing, accessibility (ARIA tags), screen reader support, and native SVG styling.
- **Isolated Math:** Eliminates scattered zoom/offset multiplication across the codebase.

### Negative / Trade-offs
- Scene graph overhead with very large shape counts ($>5,000$ elements). For OpenDraw's target domain (wireframes, system diagrams, and UI specs typically containing tens to hundreds of shapes), this trade-off is optimal.
