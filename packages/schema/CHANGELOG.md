# Changelog

All notable changes to `@open-draw/schema` are documented in this file in adherence to Semantic Versioning.

## 0.1.0 (2026-10-22)

Initial public release of `@open-draw/schema`.

### Features
- **Core Types:** Complete TypeScript definitions for `ShapeRecord`, `Snapshot`, `Bounds`, `Camera`, `Point`, and `ShapeId`.
- **Pure Geometry Helpers:** Robust, zero-dependency functions for bounds creation, validation, containment, intersection, inflation, and half-open point-in-bounds evaluation.
- **Strict Error Types:** `InvalidBoundsError` and `CorruptSnapshotError`.
- **Zero Runtime Dependencies:** Strictly zero dependencies (`dependencies: {}`).
