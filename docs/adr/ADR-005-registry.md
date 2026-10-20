# ADR-005: Shape Registry, Lifecycle, and Capabilities Contract

## Status
Accepted

## Context
In whiteboards and visual canvas engines, shape rendering and interaction often degrade into monolithic switch statements (`switch (shape.type) { case 'rect': ... case 'ellipse': ... }`). This hardcoding causes severe architectural rot:
1. Core rendering engines become tightly coupled to specific shape types.
2. Extending the system with custom or third-party shapes requires modifying core files.
3. Advanced interactions—such as inline text editing, connection routing, and clipping—rely on type checks (`if (shape.type === 'text')`) rather than polymorphic capability contracts.
4. The Phase 1 monorepo audit highlighted that four minimal functions are insufficient to govern the full interaction and lifecycle requirements of production canvas shapes.

## Decision

We establish an extensible **Shape Registry Contract** where **zero shapes are hardcoded in the canvas core**. Every shape (including primitives like `rect`) is implemented as an external or pluggable plugin implementing `ShapeDefinition<P>`.

### 1. ShapeDefinition Contract

A shape definition provides geometry, rendering, lifecycle hooks, and interaction flags:

```typescript
export interface ShapeGeometry<P> {
  bounds(shape: ShapeRecord<P>): Bounds;
  resize(shape: ShapeRecord<P>, handle: ResizeHandle, point: Point): Partial<ShapeRecord<P>>;
  hit(shape: ShapeRecord<P>, point: Point): boolean;
}

export interface ShapeDefinition<P = Record<string, unknown>> {
  readonly type: string;
  readonly defaultProps: () => P;
  readonly geometry: ShapeGeometry<P>;
  render(shape: ShapeRecord<P>, ctx: RenderContext): SVGElement | SVGElement[];
  update?(element: SVGElement, shape: ShapeRecord<P>, prevShape: ShapeRecord<P>, ctx: RenderContext): void;
  doubleClick?(shape: ShapeRecord<P>, event: MouseEvent, ctx: InteractionContext): void;
  readonly lockAspect?: boolean;
  readonly capabilities?: ShapeCapabilities<P>;
}
```

### 2. Lifecycle Contract (Mount, Patch vs Re-create)

- **Keyed Node Preservation:** The engine maintains a 1-to-1 mapping between `shape.id` and the shape's wrapper group (`<g class="od-shape" data-id="...">`). Wrappers are keyed and reused across transaction diffs.
- **Mount:** When a shape is created or first loaded, the engine creates the wrapper group, calls `def.render(shape, ctx)`, appends the returned inner SVG nodes, and appends the canvas-owned overlay slot as the **final child**.
- **Patch vs Re-create Decision:**
  - When `def.update(element, shape, prevShape, ctx)` is defined, the engine invokes `update` to perform fine-grained, allocation-free DOM attribute updates directly on the existing inner elements.
  - If `update` is omitted, the engine cleanly re-renders inner content by replacing child nodes while preserving the wrapper and overlay slot identity.
  - The wrapper's `transform="translate(x, y)"` is managed strictly by the engine and is never manipulated by shape plugins.
- **Unmount:** When deleted, the engine removes the shape wrapper and disposes of any shape-internal listeners.

### 3. Privileged Capabilities (Zero Shape-Type Branching)

Whiteboard engines typically afford special treatment to three interaction categories:
1. **Text Editing** (inline editing, cursor placement, text measurement)
2. **Connector Reconciliation** (routing lines, snapping to shape anchor points)
3. **Clipping / Masking** (frames or containers clipping their children)

Rather than checking type strings (`shape.type === 'text'`), capabilities are attached via **polymorphic capability interfaces**:

```typescript
export interface TextCapability<P> {
  canEditText(shape: ShapeRecord<P>): boolean;
  getText(shape: ShapeRecord<P>): string;
  setText(shape: ShapeRecord<P>, text: string): Partial<ShapeRecord<P>>;
  getTextBounds?(shape: ShapeRecord<P>): Bounds;
}

export interface ConnectorCapability<P> {
  getSnapPoints(shape: ShapeRecord<P>): Point[];
  getConnectionAnchor(shape: ShapeRecord<P>, target: Point): Point;
}

export interface ClippingCapability<P> {
  getClipPath(shape: ShapeRecord<P>): string | null;
  isMask(shape: ShapeRecord<P>): boolean;
}

export interface ShapeCapabilities<P> {
  readonly text?: TextCapability<P>;
  readonly connector?: ConnectorCapability<P>;
  readonly clipping?: ClippingCapability<P>;
}
```

The editor queries capabilities using structural duck-typing (`definition.capabilities?.text`), ensuring the engine remains 100% agnostic to concrete shape types.

### 4. Registration and Tool Wiring

- Shapes are registered on the editor instance via:
  ```typescript
  editor.registerShape(rectShapeDefinition);
  ```
- Tool modes (e.g. `'rect'`, `'select'`) are activated via:
  ```typescript
  editor.setTool(toolId);
  ```
- Creation tools look up the active tool's definition in the registry to construct the default record with `def.defaultProps()`.

### 5. Mechanical CI Enforcement

To guarantee no developer or future phase introduces type-branching shortcuts, a CI guardrail script scans `packages/` and `apps/` for shape type assertions (`shape.type === 'rect'`, `shape.type === 'text'`, etc.) outside the shape definition's own module. Violations fail CI immediately.

## Consequences

### Positive
- **Complete Decoupling:** Adding future shapes (ellipse, arrow, frame, note, ink) requires zero changes to the core renderer, store, or camera.
- **Zero Type Branching:** Architectural enforcement guarantees that privileged interactions remain capability-driven.
- **High Performance:** In-place `update` hook avoids DOM node reconstruction on drag and resize gestures.

### Negative / Trade-offs
- Shape plugin authors must implement the structured `ShapeDefinition` interface rather than directly writing raw SVG in engine code. Helper utility factories alleviate this overhead.
