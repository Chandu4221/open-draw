# Custom Shape Extensions in @open-draw/canvas

OpenDraw provides an extension system for declaring, creating, rendering, and hit-testing domain-specific custom shapes while preserving core document invariants (ADR-0003, R-005, R-006, R-008, R-016, R-041).

---

## 1. Extension Contract

Every custom shape extension implements `CustomShapeExtension`:

```ts
import { CAPABILITIES, type CustomShapeExtension, parseCustomShapeKind } from "@open-draw/canvas";

export const starShapeExtension: CustomShapeExtension = {
  kind: parseCustomShapeKind("vendor:star"),
  label: "Vendor Star",
  capabilities: [CAPABILITIES.movable, CAPABILITIES.resizable],
  defaultDimensions: { width: 80, height: 80 },

  // Optional custom hit-test (falls back to bounding box if omitted)
  hitTest: (box, shape, point) => {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const dx = Math.abs(point.x - cx) / (box.width / 2);
    const dy = Math.abs(point.y - cy) / (box.height / 2);
    return dx + dy <= 1.0;
  },

  // Pure SVG rendering function (Document -> string, R-008, R-021)
  render: (shape, box) =>
    `<polygon points="${box.x + box.width / 2},${box.y} ${box.x + box.width},${box.y + box.height} ${box.x},${box.y + box.height}" fill="${shape.fill ?? "#ffd700"}" />`,

  // Optional custom shape constructor
  create: (id, box, options) => ({
    id,
    kind: parseCustomShapeKind("vendor:star"),
    parentId: options?.parentId ?? "canvas:root",
    boundingBox: box,
    label: options?.label ?? "Star",
    fill: options?.fill ?? "#ffd700",
    meta: {
      order: {},
      ...(options?.meta ?? {}),
    },
  }),

  // Optional validation hook (enforced on insertion)
  validate: (shape) => {
    if (!shape.boundingBox || shape.boundingBox.width <= 0) {
      throw new Error("Invalid star dimensions");
    }
  },
};
```

---

## 2. Naming & Validation Rules

- **Kind Format (ADR-0003 D2, R-006)**: Custom shape kinds must be namespaced `<scope>:<name>` in kebab-case matching `/^[a-z0-9-]+:[a-z0-9-]+$/` (e.g., `vendor:star`, `uml:actor`, `circuit:resistor`).
- **Capabilities (ADR-0003 D1)**: Extensions declare supported capabilities from `CAPABILITIES` (`movable`, `resizable`, `textLabel`, `freehandPath`).
- **Branded Kind Conversion**: Use `parseCustomShapeKind(string)` to validate and brand kinds at boundaries.

---

## 3. Registration Lifecycle

### At Editor Initialization

```ts
import { createEditor } from "@open-draw/canvas";

const editor = createEditor(container, {
  customShapes: [starShapeExtension],
});
```

### Dynamically via Editor API

```ts
editor.registerCustomShape(starShapeExtension);
```

Registering an extension automatically:

1. Validates the extension contract loudly (R-006).
2. Registers capabilities and geometric hit-testing with the canvas controller.
3. Upgrades existing shapes of that kind from fallback rendering to the extension's SVG renderer.
4. Triggers an immediate document scene re-render.

---

## 4. Insertion and Manipulation

Insert registered shapes via `editor.insertCustomShape`:

```ts
const star = editor.insertCustomShape(
  starShapeExtension.kind,
  { x: 100, y: 100, width: 80, height: 80 },
  { fill: "#ffb703", label: "Hero Star" },
);
```

- Generates an isolated deterministic shape ID.
- Applies a transactional command (`COMMANDS.createShape`) that records into history (`editor.undo()` / `editor.redo()`).
- Selects the created shape immediately.

---

## 5. Defined Fallback Behavior (ADR-0003 D3)

When a document containing custom shapes is loaded into an editor or rendered without the extension registered:

1. The renderer **never crashes** and **never throws**.
2. It renders a neutral dashed placeholder box displaying the kind label (e.g., `[vendor:star]`).
3. An optional typed `onFallback` event is emitted.
4. When the extension is subsequently registered, the fallback placeholder seamlessly upgrades to full SVG rendering without reloading the document.

---

## 6. Serialization & Invariants

- Custom shapes serialize into canonical OpenDraw document JSON with zero timestamps (R-041) and version-only schema (`schema: { version: 1 }`).
- Box-relative geometry and standard bounding boxes guarantee moving and scaling operations work out of the box without requiring specialized document transaction handlers.
