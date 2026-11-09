# @open-draw/canvas Changelog

All notable changes to the `@open-draw/canvas` package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-11-09

### Added

- **Interactive Editor (`createEditor`)**: DOM-mountable SVG canvas editor with zero runtime dependencies (R-002, R-004, ADR-0008).
- **In-Memory Clipboard (P0-1)**: Copy (`Mod+C`) and paste (`Mod+V`) shortcuts with subtree cloning, offset cascading, and automatic child-parent ID remapping.
- **Text Content API (P0-2)**: `setTextContent(id, text)` programmatic method on `Editor` executing `COMMANDS.setShapeContent` (R-016).
- **Proportional Multi-Resize (P0-3)**: Multi-selection handles anchored to collective selection bounds (`unionBoxes()`), resizing child shapes proportionately.
- **Instance-Scoped ID Generator (P0-4)**: `createShapeIdGenerator()` replacing module-scoped sequence counters to prevent cross-editor leakage (R-008).
- **Style and Ordering APIs (P1-1)**: `setShapeStyle()` and `setShapeOrder()` on `Editor` supporting fill, stroke, strokeWidth, and responsive per-device flex ordering.
- **Controller Event Dispatch (P1-2)**: `machineChanged` event added to `CONTROLLER_EVENTS`, emitted on finite state transitions.
- **Document History Preservation (P1-3)**: `{ preserveHistory?: boolean }` option added to `setDocument()` and `loadJson()`.
- **Gesture Drag Threshold & Additive Marquee (P1-4)**: 3px drag movement threshold suppressing unintentional drags, and Shift+marquee additive multi-selection.
- **Tiered Geometry Export (P1-5)**: `unionBoxes()` exported from SDK entry point alongside core bounding box helpers.
- **Documented Architecture Boundaries & Non-Goals (P1-6, P1-7)**: Documented wheel/machine separation and declared rotation, snapping, and image shapes as v1 non-goals in README.
