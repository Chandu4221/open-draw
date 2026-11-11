# @open-draw/canvas

A framework-free, batteries-included visual canvas and drawing SDK with **zero runtime dependencies**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@open-draw/canvas.svg)](https://www.npmjs.com/package/@open-draw/canvas)

---

## Features

- **Batteries-Included Editor**: Interactive SVG canvas mountable into any DOM container with built-in pointer gestures, keyboard shortcuts, undo/redo history, camera pan/zoom, and overlay previews.
- **Pure Interaction Controller**: Headless `createCanvas()` controller with pure finite state machine, spatial hit-testing, selection management, and camera transforms.
- **Custom Shape Extension API**: Register domain-specific custom shapes with custom SVG rendering, geometric hit-testing, capability contracts, and graceful fallback support (ADR-0003).
- **Responsive Container Resizing**: Built-in `ResizeObserver` lifecycle recalculates visible viewport bounds automatically when the container resizes or transitions from hidden to visible.
- **Multi-Editor Isolation**: Safely run multiple independent canvas editors on the same page with isolated state machines, pointer captures, ID generators, and history stacks.
- **Full Document JSON Import/Paste**: Native support for pasting full OpenDraw document JSON payloads as well as shape subtrees.
- **Built-in Shapes**: First-class support for `rect`, `ellipse`, `line`, `pen-path`, and `text` with hit testing, handles, and bounding-box transforms.
- **Deterministic SVG Rendering**: Clean, predictable SVG markup generation directly from document state.
- **Zero Runtime Dependencies**: Completely standalone (`dependencies: {}`). No external runtime packages (R-002).
- **Dual ESM / CommonJS**: Bundled dual ESM (`dist/index.js`) and CJS (`dist/index.cjs`) with rolled-up TypeScript declarations (`dist/index.d.ts`).

---

## Installation

```bash
npm install @open-draw/canvas
# or
pnpm add @open-draw/canvas
```

---

## Quick Start (Interactive Editor)

Mount a complete drawing editor into any HTML container element:

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

---

## Custom Shape Extensions (ADR-0003)

Extend the canvas with custom shape kinds without modifying core commands:

```ts
import {
  CAPABILITIES,
  createEditor,
  parseCustomShapeKind,
  type CustomShapeExtension,
} from "@open-draw/canvas";

const starExtension: CustomShapeExtension = {
  kind: parseCustomShapeKind("vendor:star"),
  label: "Vendor Star",
  capabilities: [CAPABILITIES.movable, CAPABILITIES.resizable],
  defaultDimensions: { width: 80, height: 80 },

  // Custom hit-test (e.g., diamond center check)
  hitTest: (box, shape, point) => {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const dx = Math.abs(point.x - cx) / (box.width / 2);
    const dy = Math.abs(point.y - cy) / (box.height / 2);
    return dx + dy <= 1.0;
  },

  // Pure SVG rendering function
  render: (shape, box) =>
    `<polygon points="${box.x + box.width / 2},${box.y} ${box.x + box.width},${box.y + box.height} ${box.x},${box.y + box.height}" fill="${shape.fill ?? "#ffd700"}" />`,
};

const editor = createEditor(container, {
  customShapes: [starExtension],
});

// Or register dynamically:
// editor.registerCustomShape(starExtension);

// Insert custom shape into document
editor.insertCustomShape(starExtension.kind, {
  x: 100,
  y: 100,
  width: 80,
  height: 80,
});
```

See [custom-shapes.md](docs/custom-shapes.md) for full documentation on custom shape contracts, lifecycle, and fallback rendering.

---

## Editor Options & API

### `EditorOptions`

| Option            | Type                               | Description                                                     |
| ----------------- | ---------------------------------- | --------------------------------------------------------------- |
| `document`        | `Document`                         | Initial document model (defaults to empty document)             |
| `tool`            | `ToolId`                           | Active tool (defaults to `TOOLS.select`)                        |
| `customShapes`    | `readonly CustomShapeExtension[]`  | Custom shapes registered on mount                               |
| `customRenderers` | `Record<string, ShapeSvgRenderer>` | Per-kind SVG render override functions                          |
| `snapping`        | `boolean \| SnapConfig`            | Magnetic alignment snapping options                             |
| `nestingMode`     | `"containers-only" \| "all"`       | Nesting behavior when drawing over shapes                       |
| `onDoubleClick`   | `(shapeId: ShapeId) => void`       | Double-click callback hook                                      |
| `onFallback`      | `(msg: string) => void`            | Notification when an unregistered shape uses fallback rendering |

### `Editor` Instance Methods

- **Document & History**: `getDocument()`, `setDocument(doc, opts?)`, `loadJson(json, opts?)`, `toJson()`, `toSvg()`, `execute(cmds)`, `undo()`, `redo()`, `canUndo()`, `canRedo()`
- **Tools & Selection**: `getTool()`, `setTool(tool)`, `getSelection()`, `select(id)`, `selectMany(ids)`, `clearSelection()`
- **Camera Navigation**: `getCamera()`, `setCamera(cam)`, `zoomIn()`, `zoomOut()`, `resetZoom()`
- **Shape Modification**: `setTextContent(id, text)`, `setShapeStyle(id, style)`, `setShapeOrder(id, deviceType, order)`
- **Extensions**: `registerCustomShape(ext)`, `getCustomShape(kind)`, `getCustomShapes()`, `insertCustomShape(kind, box, opts?)`
- **Lifecycle**: `render()`, `destroy()`, `subscribe(event, listener)`

---

## Headless Controller (`createCanvas`)

For custom engines or server-side usage without DOM:

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

---

## Architecture Principles

- **Document is Truth (R-016)**: The document tree is immutable and canonical; mutations occur exclusively through typed transactions.
- **Camera is a Transform (R-017)**: Pan and zoom transforms never alter shape geometry coordinates.
- **No String Literals (R-005)**: Closed registries (`SHAPE_KINDS`, `COMMANDS`, `TOOLS`, `CAPABILITIES`) provide typed keys.
- **Spatial Acceleration & Viewport Culling (ADR-0011)**: In-tree zero-dependency Sort-Tile-Recursive (STR) R-Tree accelerates hit-testing, box-picking, and viewport culling across 20,000+ shapes.
- **Magnetic Alignment Snapping**: Edge and center alignment snapping with counter-scaled SVG guide lines during translation and handle resizing.
- **Multi-Touch Gestures**: TouchTracker for two-finger pinch-to-zoom and pan with pointer capture lifecycle management.

---

## License

MIT © Chandra Shekhar
