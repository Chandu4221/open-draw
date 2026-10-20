# ADR-004: Responsive — Pure Derivation, Never Canvas State

## Status
Accepted

## Context
A key value proposition of OpenDraw is specifying responsive UI behavior (breakpoint visibility, flow reordering, primary actions, mobile collapse modes) and compiling these into actionable markdown specifications for AI agents.

A naive architecture would embed responsive concepts (media queries, viewport breakpoints, active responsive modes) directly into the canvas engine. However, doing so would couple drawing performance to responsive simulation, pollute the geometry engine with UI styling logic, and make testing difficult without full browser window simulation.

## Decision
We establish the fundamental rule: **The canvas never learns the word "breakpoint."**

1. **Responsive is a pure derivation:**
   ```ts
   // In @open-draw/semantics:
   derive(scene: SceneSnapshot, options: { width: number; containers?: ContainerOverride[] }): DerivedScene
   ```
   All breakpoint calculations, flex/grid ordering (`order` property), primary flags, and visibility evaluations are pure functions living in `@open-draw/semantics`. They run in bare Node and are verified with golden fixtures.
2. **Canvas remains a dumb renderer:**
   Canvas provides only two primitives:
   - A per-shape `hidden` flag (`display: none` in SVG) which canvas renders without knowing why.
   - `applyLayout(patch)` to rapidly swap layout positions ($< 50\text{ms}$ for 200 shapes).
3. **Derived previews are transient and read-only in v0.x:**
   - Previews generated for a target breakpoint are strictly for viewing/spec verification.
   - They are never persisted to disk or serialized into the document store.
   - Switching breakpoints simply re-derives the layout from the canonical scene.
4. **Independent orderings:**
   Visual **z-order** (canvas SVG stacking order) and responsive **flow-order** (`order` attribute in semantics) are separate and never touch.

## Consequences
### Positive
- **Clean Architecture:** Zero responsive logic leaks into `@open-draw/canvas`.
- **High Performance:** Canvas rendering loops remain unburdened by media query checks.
- **Node Testability:** Complete responsive behaviors and golden specs are tested without spinning up browsers or DOM mocks.

### Negative / Trade-offs
- Users cannot directly edit shapes in non-canonical breakpoint previews in v0.x; edits must occur on the canonical desktop scene.
