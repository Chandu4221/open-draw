# Changelog

All notable changes to `@open-draw/schema` are documented in this file in adherence to Semantic Versioning.

## 0.2.0 (2026-10-23)

Feature release adding Crockford base32 shape identity generation, naming validation, and parenting cycle error type. Zero runtime dependencies preserved.

### Features
- **Shape ID Generation (ADR-006):** `generateShapeId()` producing collision-resistant 12-char uppercase identifiers using a 29-character alphabet (`0-9`, `A-Z` minus `I, L, O, U`).
- **Identity Validators (ADR-006):** `isValidShapeId()` for 12-char Crockford base32 format verification and `isValidShapeName()` enforcing 1..64 trimmed characters without control codes.
- **Hierarchy Integrity (ADR-002 Amendment):** `CycleDetectedError` thrown on invalid cyclic containment or self-parenting attempts.

## 0.1.0 (2026-10-22)

Initial public release of `@open-draw/schema`.

### Features
- **Core Types:** Complete TypeScript definitions for `ShapeRecord`, `Snapshot`, `Bounds`, `Camera`, `Point`, and `ShapeId`.
- **Pure Geometry Helpers:** Robust, zero-dependency functions for bounds creation, validation, containment, intersection, inflation, and half-open point-in-bounds evaluation.
- **Strict Error Types:** `InvalidBoundsError` and `CorruptSnapshotError`.
- **Zero Runtime Dependencies:** Strictly zero dependencies (`dependencies: {}`).
