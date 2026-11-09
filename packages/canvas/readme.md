# @open-draw/canvas

A framework-free, batteries-included visual canvas and drawing SDK with **zero runtime dependencies**.

## Features

- **Batteries-Included Editor**: Interactive SVG canvas mountable into any DOM container with built-in pointer gestures, keyboard shortcuts, undo/redo history, camera pan/zoom, and overlay previews.
- **Pure Interaction Controller**: Headless `createCanvas()` controller with pure finite state machine, spatial hit-testing, selection management, and camera transforms.
- **Built-in Shapes**: First-class support for `rect`, `ellipse`, `line`, `pen-path`, and `text` with hit testing, handles, and bounding-box transforms.
- **Deterministic SVG Rendering**: Clean, predictable SVG markup generation directly from document state.
- **Zero Runtime Dependencies**: Completely standalone. No runtime external dependencies.
- **Framework-Agnostic**: Pure TypeScript core works with React, Vue, Svelte, or vanilla DOM.

## Installation

```bash
npm install @open-draw/canvas
# or
pnpm add @open-draw/canvas
```

## Quick Start (Interactive Editor)

Mount a complete drawing editor into any HTML element:

```ts
import { createEditor, TOOLS } from "@open-draw/canvas";

const container = document.getElementById("canvas-root")!;
const editor = createEditor(container);

// Select drawing tools
editor.setTool(TOOLS.drawRect);

// Listen to document and selection changes
editor.subscribe("documentChanged", () => {
  console.log("Document updated:", editor.getDocument());
});

// Control camera navigation
editor.zoomIn();
editor.zoomOut();
editor.resetZoom();

// Export standalone SVG markup
const svgMarkup = editor.toSvg();

// Clean up when unmounting
// editor.destroy();
```

## Advanced: Headless Controller

For custom canvas engines or headless server-side usage, use `createCanvas`:

```ts
import {
  createCanvas,
  createDocument,
  createPage,
  createRect,
  documentToSvg,
  parseShapeId,
} from "@open-draw/canvas";

const canvas = createCanvas();
const pageId = parseShapeId("page-1");
const rectId = parseShapeId("rect-1");

const doc = createDocument([
  createPage(pageId, { x: 0, y: 0, width: 800, height: 600 }),
  createRect(
    rectId,
    { x: 50, y: 50, width: 200, height: 100 },
    { parentId: pageId, fill: "#3b82f6", stroke: "#1e40af" },
  ),
]);

const svgString = documentToSvg(doc);
const hitShapeId = canvas.pickShape(doc, { x: 100, y: 80 });
```

## Architecture Contract

- **Document is Truth (R-016)**: The document tree is immutable and canonical; mutations occur exclusively through typed transactions.
- **Camera is a Transform (R-017)**: Pan and zoom transforms never alter shape geometry coordinates.
- **Machine & Viewport Separation (R-008, R-009)**: The state machine consumes pure pointer events. Wheel events are ignored by the state table and handled directly as camera viewport transforms by the imperative editor shell.

## Scope & Non-Goals for v1

The v1 release focuses on diagramming, wireframing, and vector sketching primitives:

- **Shape Rotation**: Non-goal for v1 (axis-aligned bounding boxes only).
- **Grid / Object Snapping**: Non-goal for v1 (reserved for extension layer).
- **Image / Raster Asset Shapes**: Non-goal for v1 (vector primitives and text only).

## License

MIT © Chandra Shekhar
