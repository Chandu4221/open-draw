# Project Context

## Project Overview
`open-draw` is a suite of small, independently publishable, zero-runtime-dependency packages that together form a design-to-spec tool.
**Core Product Thesis:** *"Give AI the structure, not the pixels."* OpenDraw turns wireframes drawn on an infinite DOM Canvas into a precise, deterministic, machine-readable markdown specification for AI agents and developers.

## Terminology (Binding)
- **DOM Canvas**: Every shape is a real DOM/SVG element inside one root `<svg>`. Overlays are DOM children of shape wrapper groups (`getOverlaySlot`).
- **HTML Canvas**: The `<canvas>` bitmap element is explicitly rejected (failed predecessor transform-coherence).

## Monorepo Layout (5 Packages)
1. **`packages/schema`** (`@open-draw/schema`): Shared structural types (`ShapeId`, `Bounds`, snapshots) and pure geometry functions (`boundsContain`, intersection). Consumed by both `canvas` and `semantics` so neither depends on the other.
2. **`packages/canvas`** (`@open-draw/canvas`): DOM Canvas engine. Zero hardcoded shapes (pluggable `ShapeDefinition` registry). Shapes rendered as SVG elements. Transform math strictly isolated to `camera.ts`.
3. **`packages/semantics`** (`@open-draw/semantics`): Meaning layer: types, parenting, platform profiles (`web`, `android`, `flutter`), and responsive derivations. Runs in bare Node.
4. **`packages/markdown`** (`@open-draw/markdown`): Pure, stateless, deterministic annotated-scene $\to$ markdown compiler. Output is a frozen public contract pinned by golden fixtures.
5. **`apps/studio`** (`@open-draw/studio`): OpenDraw Studio — thin React composition shell with zero business logic.

## One-Way Dependency Graph
```
studio ──> canvas, semantics, markdown, schema
markdown ──> semantics, schema (types only)
semantics ──> schema (types + geometry)
canvas ──> schema (types + geometry)
schema ──> (none)
```

## Master Context
- **Master Context**: [`project-context/OPENDRAW-CONTEXT.md`](../project-context/OPENDRAW-CONTEXT.md) and [`OPENDRAW.md`](../OPENDRAW.md).

## Completed Phase
- **Phase 2.y: Selection & Handles** (Exit Gate complete, 38 E2E tests, 157 unit tests, 7 guardrails green, merged to `main`).

## Next Phase
- **SDK Freeze**: `@open-draw/canvas@0.1.0` (README, API docs from ADR-005 + Phase 2 contracts, exportPNG).
