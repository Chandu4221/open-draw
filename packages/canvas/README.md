# @open-draw/canvas

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/badge/npm-0.4.0-green.svg)](https://www.npmjs.com/package/@open-draw/canvas)

> DOM Canvas engine — an infinite canvas where every shape is a real SVG element.

`@open-draw/canvas` provides a high-performance, pure SVG DOM canvas engine. It powers infinite pan and zoom, reactive transactions, undo/redo history, shape registration, live preview transforms, inline text editing, and export to PNG, all while maintaining strict zero runtime dependencies outside of `@open-draw/schema`.

---

### Installation

```bash
npm install @open-draw/canvas @open-draw/schema
```

---

### Minimal Example (30 lines)

```typescript
import { CanvasEditor } from '@open-draw/canvas';

// 1. Initialize and mount canvas
const container = document.getElementById('canvas-container')!;
const editor = new CanvasEditor();
editor.mount(container);

// 2. Create shapes via reactive transactions
const note = editor.createShape({
  type: 'note',
  x: 100,
  y: 100,
  props: { width: 180, height: 120, color: '#fef08a', text: 'Important Note' },
});

// 3. Attach custom HTML/SVG badges into the shape's overlay slot
const slot = editor.getOverlaySlot(note.id);
if (slot) {
  const badge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  badge.setAttribute('x', '10');
  badge.setAttribute('y', '24');
  badge.textContent = 'STATUS: REVIEW';
  slot.appendChild(badge);
}

// 4. Undo and redo with single-step atomic transactions
editor.undo();
editor.redo();

// 5. Export canvas to PNG Blob
const pngBlob = await editor.exportPNG({ chips: true });
```

---

### Try the Playground

You can run the interactive development playground locally from the repository root:

```bash
npx vite --config packages/canvas/e2e/playground/vite.config.ts packages/canvas/e2e/playground --host 127.0.0.1 --port 5173
```

Navigate to `http://127.0.0.1:5173/` in your browser to interact with the live canvas, test gestures, and benchmark FPS.

---

### Semver Statement

Starting from version `0.1.0`, the public API surface of `@open-draw/canvas` is frozen under CI surveillance. No public export or contract will be changed or removed without an advance minor-version deprecation cycle.

---

### License

MIT © Chandu4221
