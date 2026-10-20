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

## Active Phase
- **Phase 1: Monorepo Foundation & Guardrails** (Branch: `build/phase-1` $\to$ merge to `main` upon exit checklist completion).
- Focus: Step 0 (OPENDRAW.md, 4 ADRs, questions/spike logs) $\to$ Root cleanup $\to$ License $\to$ 5 packages scaffolding $\to$ CI guardrails (import-boundary, deps, bitmap check) $\to$ Red/Green boundary proof $\to$ Phase 1 Report.
