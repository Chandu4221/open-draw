# @open-draw/canvas Changelog

All notable changes to the `@open-draw/canvas` package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Container Resize Handling (R-008, R-016)**: Integrated `ResizeObserver` on editor container with zero-dimension hidden state skipping and automatic viewport recalibration.
- **Custom Shape Extensions (ADR-0003, R-005, R-006)**: `CustomShapeContract` extension API with runtime registration, validation, default shape factory, and hit-testing hooks.
- **Document JSON Paste Support (R-006, R-016, R-018)**: Native clipboard ingestion of full document JSON trees (`schema.version: 1`) with shape limit enforcement and ID remapping.
- **Multi-Editor Browser Isolation (R-008, ADR-0008)**: Independent gesture controllers, history stacks, and camera state verified in Chromium.
- **Macro Performance Benchmarks (ADR-0008)**: Viewport culling and hit-test benchmarks scaling to 20,000 shapes (2x safety margin).

### Fixed

- **Select Tool Marquee Overlay (R-008, R-016)**: Marquee selection rectangle rendered with `fill="none"` borders only to eliminate solid background color occlusion.
- **Pointer & Clipboard Isolation (R-006, R-008, ADR-0002)**: Resolved clipboard envelope shadowing, pointer capture release leaks, and paste shape boundaries across concurrent editors.

## [0.9.0] - 2026-11-10

### Added

- **In-Tree Spatial Index (ADR-0011)**: Sort-Tile-Recursive (STR) packed 2D R-Tree providing $O(\log N + K)$ point hit-testing, box-picking, and viewport culling with zero runtime dependencies (R-002).
- **Magnetic Alignment Snapping**: Pure snap solver for edge-to-edge, center-to-center, and handle-constrained resize snapping with live counter-scaled SVG guide lines.
- **Multi-Touch Gestures**: Two-finger pinch-to-zoom and pan via pure `TouchTracker`, with pointer capture lifecycle management and `pointerType === "touch"` filtering.
- **Transform-Only Camera Optimization (R-017, R-018)**: Hardware-accelerated viewport transforms decoupled from document scene re-serialization, eliminating frame drops during pan and zoom.
- **Platform-Aware Reparenting (R-004, R-024, R-026)**: Enforced neutral canvas non-reparenting for geometric rectangles while enabling structural parenting inside platform roots.
- **Clipboard & Security Hardening (R-006)**: Validated shape boundary schemas and prototype pollution guards on OS clipboard paste.

## [0.8.0] - 2026-11-09

### Added

- **Interactive Editor (`createEditor`)**: DOM-mountable SVG canvas editor with zero runtime dependencies (R-002, R-004, ADR-0008).
- **In-Memory & System Clipboard (P0-1)**: Copy (`Mod+C`) and paste (`Mod+V`) shortcuts with subtree cloning, offset cascading, automatic child-parent ID remapping, and `navigator.clipboard` synchronization.
- **Text Content API (P0-2)**: `setTextContent(id, text)` programmatic method on `Editor` executing `COMMANDS.setShapeContent` (R-016).
- **Proportional Multi-Resize (P0-3)**: Multi-selection handles anchored to collective selection bounds (`unionBoxes()`), resizing child shapes proportionately.
- **Instance-Scoped ID Generator (P0-4)**: `createShapeIdGenerator()` replacing module-scoped sequence counters to prevent cross-editor leakage (R-008).
- **Style and Ordering APIs (P1-1)**: `setShapeStyle()` and `setShapeOrder()` on `Editor` supporting fill, stroke, strokeWidth, and responsive per-device flex ordering.
- **Controller Event Dispatch (P1-2)**: `machineChanged` event added to `CONTROLLER_EVENTS`, emitted on finite state transitions.
- **Document History Preservation (P1-3)**: `{ preserveHistory?: boolean }` option added to `setDocument()` and `loadJson()`.
- **Gesture Drag Threshold & Additive Marquee (P1-4)**: 3px drag movement threshold suppressing unintentional drags, and Shift+marquee additive multi-selection.
- **Tiered Geometry Export (P1-5)**: `unionBoxes()` exported from SDK entry point alongside core bounding box helpers.
- **Documented Architecture Boundaries & Non-Goals (P1-6, P1-7)**: Documented wheel/machine separation and declared rotation, snapping, image shapes, rich text, and native file drag-and-drop as v1 non-goals in README.

### Removed

- **Module-Level `nextShapeId` and `seedShapeSequence`**: Removed in favor of instance-scoped `createShapeIdGenerator(doc)` to eliminate global ID collision hazards across instances (R-008).
