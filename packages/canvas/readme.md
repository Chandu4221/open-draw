# @open-draw/canvas

A framework-free, batteries-included visual canvas and drawing SDK with **zero runtime dependencies**.

## Features

- **Batteries-included**: Core document tree, transactions, history (undo/redo), camera controller (pan/zoom), selection, and hit-testing in a single package.
- **Built-in Shapes**: Out-of-the-box support for `rect`, `ellipse`, `line`, `pen-path`, and `text` with hit testing and bounding-box transforms.
- **Pure SVG Rendering**: Deterministic SVG markup rendering directly from document state.
- **Zero Runtime Dependencies**: Completely standalone. No runtime external dependencies.
- **Framework-Agnostic**: Pure TypeScript core works with React, Vue, Svelte, or vanilla DOM.

## Installation

```bash
npm install @open-draw/canvas
# or
pnpm add @open-draw/canvas
```

## Quick Start

```ts
import {
  createCanvas,
  createDocument,
  createPage,
  createRect,
  createText,
  documentToSvg,
  parseShapeId,
} from "@open-draw/canvas";

// 1. Create a canvas controller
const canvas = createCanvas();

// 2. Build a document scene
const pageId = parseShapeId("page-1");
const rectId = parseShapeId("rect-1");
const textId = parseShapeId("text-1");

const doc = createDocument([
  createPage(pageId, { x: 0, y: 0, width: 800, height: 600 }),
  createRect(
    rectId,
    { x: 50, y: 50, width: 200, height: 100 },
    { parentId: pageId, fill: "#3b82f6", stroke: "#1e40af" },
  ),
  createText(
    textId,
    { x: 60, y: 70, width: 180, height: 40 },
    { parentId: rectId, content: "Hello Canvas" },
  ),
]);

// 3. Render the document to SVG
const svgString = documentToSvg(doc);

// 4. Hit-test and interact
const hitShapeId = canvas.pickShape(doc, { x: 100, y: 80 });
console.log("Clicked shape:", hitShapeId);
```

## License

MIT © Chandra Shekhar
