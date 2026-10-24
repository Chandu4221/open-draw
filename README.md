# OpenDraw

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/badge/npm-0.6.0-green.svg)](https://www.npmjs.com/package/@open-draw/canvas)

> An infinite DOM canvas where every shape is a real SVG element — draw, tag, compile to a spec your AI can build from.

OpenDraw is a web-first infinite canvas engine engineered from the ground up for AI-human visual collaboration. Unlike conventional black-box `<canvas>`/WebGL editors that render inaccessible pixels, OpenDraw renders every single canvas element as a real, accessible, interactive SVG element directly inside the DOM tree.

---

### What & Why

- **Real SVG Elements in the DOM:** Every shape is inspectable in your browser DevTools. Glue live HTML chips, tags, or status badges into dedicated shape overlay slots with zero position drift under infinite pan, zoom, or rotation.
- **Pure Dependency Architecture:** Zero third-party runtime dependencies (`dependencies: {}`). Strict, statically enforced one-way architectural boundaries ensure modularity, predictable performance, and minimal bundle sizes.
- **Built for AI Workflows:** Organize complex architectures with auto-clipping frames, bind dynamic connector arrows, and compile drawings into structured semantic specs or export clean PNGs for generative agents.

---

### Quickstart

Install the core engine and schema:

```bash
npm install @open-draw/canvas @open-draw/schema
```

Create a canvas, mount it, add shapes, glue an HTML badge into the overlay slot, and manipulate the scene:

```typescript
import { CanvasEditor } from '@open-draw/canvas';

// 1. Mount editor onto a container element
const container = document.getElementById('canvas-container')!;
const editor = new CanvasEditor();
editor.mount(container);

// 2. Create shapes via reactive transactions
const rect = editor.createShape({
  type: 'rect',
  x: 100,
  y: 100,
  props: { width: 160, height: 100, fill: '#3b82f6', stroke: '#1d4ed8' },
});

// 3. Glue live HTML or SVG chips directly into the shape's overlay slot
const slot = editor.getOverlaySlot(rect.id);
if (slot) {
  const badge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  badge.setAttribute('x', '8');
  badge.setAttribute('y', '20');
  badge.setAttribute('fill', '#ffffff');
  badge.textContent = 'API Gateway';
  slot.appendChild(badge);
}

// 4. Undo / redo with single-step atomic transactions
editor.undo();
editor.redo();
```

---

### Architecture

OpenDraw strictly enforces one-way architectural layering checked at CI:

```
@open-draw/studio       (interactive designer app)
       │
       ▼
@open-draw/markdown     (bi-directional visual markdown compiler)
       │
       ▼
@open-draw/semantics    (high-level semantic model & AI export compiler)
       │
       ▼
@open-draw/canvas       (DOM Canvas engine — pure SVG rendering & gesture controller)
       │
       ▼
@open-draw/schema       (pure geometric primitives & document snapshot schema)
```

---

### Guardrail & Fence Culture

OpenDraw adheres to an uncompromising engineering standard: **every guardrail is proven broken before it's trusted — red/green proofs in CI.**

The codebase is protected by 9 automated CI fences:
1. **One-Way Import Boundaries (`check:boundaries`):** Forbids upwards or horizontal package imports.
2. **Zero Runtime Dependencies (`check:deps`):** Ensures all packages maintain zero runtime dependencies (with `@open-draw/canvas` depending strictly on `@open-draw/schema`).
3. **Pure DOM Canvas / No Bitmap (`check:bitmap`):** Forbids `getContext` in render paths to ensure pure SVG/DOM architecture.
4. **Isolated Zoom Math (`check:zoom`):** Isolates all camera zoom/pan mathematics to `camera.ts`.
5. **No Shape Branching (`check:shapes`):** Forbids hardcoded shape-type switch/if statements outside polymorphic plugin modules.
6. **Strict File Size Budget (`check:filesize`):** Every source file is capped at $\le 300$ lines.
7. **Portable Links (`check:links`):** Forbids non-portable file paths across documentation.
8. **Interaction Performance Fence (`check:perf`):** Enforces 60 FPS and 0 dropped frames under continuous 100-shape gestures.
9. **Public API Golden Fence (`check:public-api`):** Freezes public exports against `docs/api-0.1.0.snapshot.json`.

---

### Versioning & Deprecation

OpenDraw is in active `0.x` stabilization. Starting from `0.1.0`:
- The public export surface is locked under CI gate.
- No public API will be altered or removed without a prior minor-version deprecation cycle.
- Breaking changes will trigger minor version increments (`0.1.x` $\to$ `0.2.x`) until `1.0.0`.

---

### Documentation & References

- [Public API Reference](docs/api-0.1.0.md)
- [Architecture Decision Records (ADRs)](docs/adr/ADR-001-pure-dom-canvas.md)
- [Project Context & Roadmap](project-context/OPENDRAW-CONTEXT.md)
- [Phase Verification Reports](docs/od-verification/2z/REPORT.md)
- [Questions & Ruling Log](docs/od-questions.md)

---

### License

MIT © Chandu4221
