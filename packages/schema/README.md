# @open-draw/schema

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/badge/npm-0.2.0-green.svg)](https://www.npmjs.com/package/@open-draw/schema)

> Shared structural types and pure geometric primitives for the OpenDraw canvas engine.

`@open-draw/schema` provides zero-dependency TypeScript types (`ShapeId`, `Bounds`, `Camera`, `ShapeRecord`, `Snapshot`) and pure half-open geometric functions (`boundsContain`, `boundsUnion`, `boundsIntersect`, `pointInBounds`).

---

### Installation

```bash
npm install @open-draw/schema
```

---

### Example Usage (10 lines)

```typescript
import { boundsOf, boundsUnion, boundsContain, pointInBounds } from '@open-draw/schema';

const frame = boundsOf(0, 0, 800, 600);
const card = boundsOf(100, 100, 200, 150);

// Fast, half-open geometric evaluations [x, x+width) × [y, y+height)
const isContained = boundsContain(frame, card); // true
const isPointInside = pointInBounds({ x: 150, y: 150 }, card); // true
const unionBounds = boundsUnion(frame, boundsOf(700, 500, 300, 200));
```

---

### Semver Statement

From version `0.1.0` forward, `@open-draw/schema` types and functions are frozen. Changes require a minor version deprecation cycle.

---

### License

MIT © Chandu4221
