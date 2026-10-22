# OpenDraw 0.1.0 — Public API Reference & Freeze Contract

This document enumerates every public export of `@open-draw/schema@0.1.0` and `@open-draw/canvas@0.1.0`. Every export listed here forms a stable contract governed by semantic versioning and the 0.1.0 golden export fence (`scripts/check-public-api.js` backed by `docs/api-0.1.0.snapshot.json`).

From `0.1.0` forward, no public export may be altered or removed without a documented minor-version deprecation cycle.

---

## 1. `@open-draw/schema@0.1.0`

Zero runtime dependencies (`dependencies: {}`). Core geometric primitives, document snapshot schema, and mathematical helpers.

### Core Types & Errors
| Export | Kind | Status | Purpose |
|---|---|---|---|
| `ShapeId` | Type | **Frozen** | Unique string identifier for shapes (`string`). |
| `Point` | Interface | **Frozen** | 2D coordinate pair `{ readonly x: number, readonly y: number }`. |
| `Bounds` | Interface | **Frozen** | Axis-aligned bounding box `{ readonly x: number, readonly y: number, readonly width: number, readonly height: number }`. |
| `Camera` | Interface | **Frozen** | Viewport camera state `{ readonly x: number, readonly y: number, readonly zoom: number }`. |
| `ShapeRecord<P>` | Interface | **Frozen** | Immutable shape record with type, coordinates, rotation, meta namespace, and custom props. |
| `Snapshot` | Interface | **Frozen** | Serialized canvas document with schema version, shape list, camera, and document metadata. |
| `InvalidBoundsError` | Class | **Frozen** | Error thrown when bounds have negative dimensions or non-finite coordinates. |
| `CorruptSnapshotError` | Class | **Frozen** | Error thrown when snapshot payload fails schema validation. |

### Geometry Functions
| Export | Signature | Status | Purpose |
|---|---|---|---|
| `validateBounds` | `(bounds: Bounds) => void` | **Frozen** | Asserts bounds coordinates and dimensions are finite and non-negative. |
| `boundsOf` | `(x: number, y: number, width: number, height: number) => Bounds` | **Frozen** | Factory function creating and validating an immutable `Bounds` object. |
| `boundsFromPoints` | `(points: ReadonlyArray<Point>) => Bounds` | **Frozen** | Calculates the minimum bounding box enclosing an array of points. |
| `boundsCenter` | `(bounds: Bounds) => Point` | **Frozen** | Computes the center `Point` of a given `Bounds`. |
| `translateBounds` | `(bounds: Bounds, dx: number, dy: number) => Bounds` | **Frozen** | Translates a bounding box by delta `dx` and `dy`. |
| `inflate` | `(bounds: Bounds, dx: number, dy: number) => Bounds` | **Frozen** | Expands or contracts bounds by delta on all sides. |
| `pointInBounds` | `(point: Point, bounds: Bounds) => boolean` | **Frozen** | Evaluates half-open point containment `[x, x+width) × [y, y+height)`. |
| `boundsContain` | `(container: Bounds, inner: Bounds) => boolean` | **Frozen** | Evaluates if `container` completely encloses `inner` bounds. |
| `boundsIntersect` | `(a: Bounds, b: Bounds) => boolean` | **Frozen** | Tests whether two bounding boxes overlap with half-open edge semantics. |
| `boundsUnion` | `(a: Bounds, b: Bounds) => Bounds` | **Frozen** | Computes the union bounding box enclosing both `a` and `b`. |
| `frameContains` | `(frame: Bounds, shape: Bounds) => boolean` | **Frozen** | Helper checking frame container containment of child shape bounds. |

---

## 2. `@open-draw/canvas@0.1.0`

Pure SVG DOM canvas engine. Exactly one dependency: `@open-draw/schema@0.1.0`.

### Engine & Editor Lifecycle
| Export | Kind | Status | Purpose |
|---|---|---|---|
| `CanvasEditor` | Class | **Frozen** | Main entrypoint composing store, camera, renderer, registry, capabilities, and tools. |
| `CanvasEditorOptions` | Interface | **Frozen** | Configuration options for editor initialization (e.g. `readonly`). |
| `CanvasEngineOptions` | Interface | **Frozen** | Configuration options for canvas engine. |
| `DOMCanvasEngine` | Class | **Frozen** | DOM canvas engine wrapper. |
| `EditorMode` | Type | **Frozen** | Operational editor mode (`'none' \| 'editing' \| 'gesture'`). |

### Reactive Store & Transactions
| Export | Kind | Status | Purpose |
|---|---|---|---|
| `CanvasStore` | Class | **Frozen** | In-memory reactive shape store with transaction batching, history (undo/redo), and meta validation. |
| `StoreDiff` | Interface | **Frozen** | Detailed shape change diff containing `created`, `updated`, and `deleted` shape IDs. |
| `StoreListener` | Type | **Frozen** | Callback signature invoked when store transactions commit. |
| `MetaValidator` | Type | **Frozen** | Predicate validator function for custom metadata namespaces. |
| `HistoryEntry` | Interface | **Frozen** | Snapshot of shape changes for an atomic undo/redo transaction step. |
| `computeDiff` | Function | **Frozen** | Computes differences between two maps of `ShapeRecord`. |
| `parseAndValidateSnapshot` | Function | **Frozen** | Validates and parses raw snapshot data into a compliant `Snapshot`. |
| `reorderShapes` | Function | **Frozen** | Reorders shape z-indices according to a specified sequence. |

### Camera & Viewport
| Export | Kind | Status | Purpose |
|---|---|---|---|
| `CameraController` | Class | **Frozen** | Manages camera coordinate math, pan, zoom around point, fit-to-bounds, and change notifications. |
| `DEFAULT_CAMERA` | Constant | **Frozen** | Default camera position `{ x: 0, y: 0, zoom: 1 }`. |
| `InvalidCameraError` | Class | **Frozen** | Thrown on non-finite camera coordinates or non-positive zoom. |
| `InvalidZoomError` | Class | **Frozen** | Thrown when zoom factor is non-positive or non-finite. |
| `ZoomOptions` | Interface | **Frozen** | Options constraining zoom operations (`minZoom`, `maxZoom`). |
| `createCamera` | Function | **Frozen** | Factory function creating and validating immutable `Camera` state. |
| `cameraToTransform` | Function | **Frozen** | Formats camera state as an SVG transform string `translate(...) scale(...)`. |
| `pageToScreen` | Function | **Frozen** | Maps canvas page/world coordinates to screen/viewport coordinates. |
| `screenToPage` | Function | **Frozen** | Maps screen/viewport coordinates to canvas page/world coordinates. |
| `panCamera` | Function | **Frozen** | Pure function panning camera by a screen-space delta. |
| `containFit` | Function | **Frozen** | Computes uniform scale factor to contain bounds inside viewport dimensions. |
| `fitToBounds` | Function | **Frozen** | Calculates camera state centered and scaled to fit target bounds. |
| `zoomAroundPoint` | Function | **Frozen** | Zooms camera toward or away from an anchor point on screen. |
| `zoomFit` | Function | **Frozen** | Adjusts camera to fit all given bounds within viewport. |
| `zoomSelection` | Function | **Frozen** | Adjusts camera to fit currently selected shape bounds. |

### Shape Registry & Extensibility Contract
| Export | Kind | Status | Purpose |
|---|---|---|---|
| `ShapeRegistry` | Class | **Frozen** | Polymorphic shape definition registry mapping shape types to definitions. |
| `ShapeDefinition` | Interface | **Frozen** | Plugin contract providing geometry, SVG rendering, update functions, and capabilities for a shape. |
| `DuplicateShapeTypeError` | Class | **Frozen** | Thrown when attempting to register a shape type already present in registry. |
| `ShapeCapabilityText` | Interface | **Frozen** | Text editing capability contract for shapes supporting inline text editing. |
| `ShapeCapabilityClipping` | Interface | **Frozen** | Clipping capability contract for container frames that clip child shapes. |
| `ShapeCapabilityConnector` | Interface | **Frozen** | Connector capability contract for shapes binding endpoints to anchor points. |

### Built-in Shape Definitions
| Export | Kind | Status | Purpose |
|---|---|---|---|
| `rectDefinition` / `rectGeometry` / `renderRect` / `updateRect` | Functions | **Frozen** | Standard rectangle shape definition, geometry, DOM render, and live transform updater. |
| `ellipseDefinition` / `ellipseGeometry` / `renderEllipse` / `updateEllipse` | Functions | **Frozen** | Ellipse shape definition, geometry, DOM render, and live transform updater. |
| `noteDefinition` / `noteGeometry` / `renderNote` / `updateNote` / `MIN_NOTE_WIDTH` / `MIN_NOTE_HEIGHT` | Functions & Constants | **Frozen** | Sticky note shape with auto-grow bounds and text capability. |
| `imageDefinition` / `imageGeometry` / `renderImage` / `updateImage` / `attachImageTransferHandlers` / `createImageFromDataUrl` | Functions | **Frozen** | Bitmap image shape with drag-drop/paste transfer handlers. |
| `textDefinition` / `textGeometry` / `renderText` / `updateText` | Functions | **Frozen** | Standalone text shape with SVG text rendering and editing capability. |
| `frameDefinition` / `frameGeometry` / `renderFrame` / `updateFrame` / `DEFAULT_FRAME_PROPS` | Functions & Constants | **Frozen** | Container frame shape with clipping and child containment. |
| `arrowDefinition` / `arrowGeometry` / `renderArrow` / `updateArrow` / `DEFAULT_ARROW_PROPS` / `resolveArrowEndpoints` | Functions & Constants | **Frozen** | Dynamic connector arrow shape with anchor binding. |
| `inkDefinition` / `inkGeometry` / `renderInk` / `updateInk` / `DEFAULT_INK_PROPS` / `pointsToSvgPath` / `simplifyRDP` | Functions & Constants | **Frozen** | Freehand ink stroke shape with RDP path simplification. |
| `highlighterDefinition` / `DEFAULT_HIGHLIGHTER_PROPS` | Definition & Constants | **Frozen** | Semi-transparent highlighter stroke shape. |
| `groupDefinition` / `groupGeometry` / `renderGroup` / `updateGroup` / `findGroupForMember` / `getGroupMembers` / `isGroupShape` | Functions | **Frozen** | Group container shape and membership query helpers. |

### DOM Rendering & Overlay Invariant
| Export | Kind | Status | Purpose |
|---|---|---|---|
| `SVGRenderer` | Class | **Frozen** | Pure SVG DOM renderer maintaining the overlay slot contract (last child, identity transform). |

### Selection, Handles & Transforms
| Export | Kind | Status | Purpose |
|---|---|---|---|
| `SelectionManager` | Class | **Frozen** | Manages selected shape IDs, handles overlay, resize/rotate gestures, and reparenting. |
| `SelectionState` / `SelectionListener` | Types | **Frozen** | Selection state record and listener callback signature. |
| `MarqueeOverlay` / `computeMarqueeBounds` / `findIntersectingShapes` | Class & Functions | **Frozen** | Marquee drag selection overlay and spatial intersection detection. |
| `renderHandles` / `removeHandles` / `getHandleDescriptors` | Functions | **Frozen** | Renders and updates bounding box handles with constant-screen-size counter-scaling. |
| `resizeBounds` | Function | **Frozen** | Computes transformed bounds during handle drag with aspect ratio preservation. |
| `rotatePoint` / `computeRotationAngle` | Functions | **Frozen** | Calculates rotation angles with optional Shift-key 15° snapping. |
| `handleGestureReparent` / `findSuggestedParent` / `isContainedWithin` | Functions | **Frozen** | Reparents shapes into frames or orphans them upon detachment. |

### Capabilities
| Export | Kind | Status | Purpose |
|---|---|---|---|
| `TextEditingManager` | Class | **Frozen** | Manages inline text editing via overlay slot `<foreignObject><textarea>`. |
| `ClippingManager` | Class | **Frozen** | Computes SVG `clipPath` definitions for nested container frames. |
| `ConnectorManager` | Class | **Frozen** | Recomputes connector arrow endpoints when bound target shapes move. |
| `getAnchorPoint` / `lineSegmentIntersectsBounds` | Functions | **Frozen** | Computes shape perimeter anchor points for connector routing. |

### Tools & Commands
| Export | Kind | Status | Purpose |
|---|---|---|---|
| `StrokeEraserController` | Class | **Frozen** | Freehand stroke eraser tool detecting intersections with shapes and child elements. |
| `KeyboardDispatcher` / `DEFAULT_KEYMAP` / `KeyBinding` / `CommandId` / `isMod` | Classes & Types | **Frozen** | Central keyboard shortcut dispatcher with customizable keymap injection. |
| `executeCommand` / `deleteSelection` / `duplicateSelection` / `nudge` | Functions | **Frozen** | Command handlers for deleting, duplicating, and arrow-key nudging. |
| `clipboardCopy` / `clipboardCut` / `clipboardPaste` | Functions | **Frozen** | Internal clipboard serialization and offset pasting. |

### Export
| Export | Kind | Status | Purpose |
|---|---|---|---|
| `exportPNG` | Function | **Frozen** | Serializes canvas SVG to PNG Blob with chips on/off and view/content camera modes. |
| `ExportPngOptions` | Interface | **Frozen** | Configuration for PNG export (`chips`, `camera`, `scale`). |

### Experimental APIs
| Export | Kind | Status | Purpose |
|---|---|---|---|
| `FrameTelemetry` | Class | **Experimental** | Measures frame latency, FPS, and dropped frames during interaction performance profiling. |
| `TelemetryMetrics` | Interface | **Experimental** | Performance metric snapshot (`fps`, `p50LatencyMs`, `p95LatencyMs`, `droppedFrames`). |
| `GestureController` | Class | **Experimental** | In-flight gesture state machine bypassing store transactions for 60fps live previews. |
| `GestureType` | Type | **Experimental** | Active gesture classification (`'drag' \| 'resize' \| 'rotate' \| 'pan' \| 'draw'`). |
