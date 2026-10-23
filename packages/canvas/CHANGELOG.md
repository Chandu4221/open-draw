# Changelog

All notable changes to `@open-draw/canvas` are documented in this file in adherence to Semantic Versioning.

## 0.3.0 (2026-10-23)

Feature & usability release: strict drag-to-draw shape creation, real-time live drag rendering with clean single-step history merging, and selection focus outline glitch elimination. Zero runtime dependencies preserved.

### Features & Improvements
- **Strict Drag-to-Draw Shape Creation:**
  - Defer shape creation and DOM mounting to pointer movement exceeding $3\text{px}$ (`dist > 3`).
  - Single clicks or small pointer jitter ($\le 3\text{px}$) no longer insert default shapes or pollute the store/history stack, cleanly reverting the active tool to `select`.
  - Polymorphic sizing via `def.geometry.resize(shape, box, point)` supporting bidirectional dragging (including top/left normalization) and 1:1 aspect ratio constraint via <kbd>Shift</kbd>.
- **60 FPS Live Rendering & Single-Step Undo:**
  - Shape and freehand inking updates render in real-time on `pointermove` at 60 FPS without waiting for mouse release.
  - Transparently collapses intermediate gesture updates via `mergeLastHistoryEntry()`, allowing `Ctrl+Z` to remove newly drawn shapes in a single undo step.
- **Selection Focus Outline Glitch Elimination:**
  - Marked active selected shapes with `.od-selected` in the selection manager and suppressed native browser `:focus-visible` outlines on selected shapes (`.od-shape.od-selected { outline: none !important; }`), preventing an unrotated secondary bounding outline when shapes are rotated.

## 0.2.0 (2026-10-22)

Hardening release: cross-browser engine verification, accessibility (a11y) audit, and memory/listener leak suites. Zero runtime dependencies preserved.

### Hardening & Improvements
- **Cross-Browser Multi-Engine Support:**
  - Extended E2E suite to run continuously across `chromium`, `firefox`, and `webkit`.
  - Standardized selection handles with `vector-effect="non-scaling-stroke"` for consistent 1.5px visual stroke across zoom levels on all engines.
  - Resolved SVG bounding box computation differences in Gecko (stroke-box vs fill-box) without user-agent sniffing.
- **Accessibility (a11y) Architecture:**
  - Integrated automated `@axe-core/playwright` accessibility audits across key canvas states (empty canvas, multi-shape collections, active selection, in-flight gestures, text editing, frame hierarchies).
  - Assigned semantic `role="group"` to container shapes (`frame`, `group`) and `role="button"` to atomic interactive shapes to eliminate `nested-interactive` violations.
  - Implemented WCAG 2.5.3 compliant accessible labeling (`props.text` / `props.label` incorporated into `aria-label`).
  - Added visible `:focus-visible` styling (`outline: 2px solid #3b82f6`) on `.od-shape` and `.od-canvas-root`.
  - Added explicit `aria-label` to inline text editing `<textarea>`.
- **Memory & Listener Leak Elimination:**
  - 50-cycle editor lifecycle test verifying bounded DOM growth and clean container teardown.
  - Added text editing cleanup (`this.textEditing.cancel()`) on `editor.destroy()`.
  - Complete listener teardown symmetry on `editor.destroy()` proven via red/green tests.
  - Validated 100-cycle non-destructive overlay restoration in `editor.exportPNG()`.

## 0.1.0 (2026-10-22)

Initial public release of `@open-draw/canvas`.

### Features
- **Pure DOM SVG Canvas Engine:** Infinite pan and zoom with counter-scaled handles and identity-transform overlay slots.
- **Reactive Transaction Store:** Atomic state mutations with single-step undo/redo and custom meta-namespace validation.
- **9 Built-in Shape Plugins:** Rect, ellipse, sticky note, image, text, frame, connector arrow, ink, and highlighter.
- **Dynamic Connector Routing:** Per-frame anchor binding and automatic edge recalculation on shape transform.
- **Container Frames & Clipping:** Nested shape containment, automatic SVG `clipPath` generation, and gesture reparenting.
- **Live Preview Performance:** Gesture state machine bypassing store transactions during pointer movement, maintaining 60 FPS under continuous 100-shape interactions.
- **Inline Text Editing:** SVG `<foreignObject>` textarea integration with auto-growing bounds and non-destructive cancellation.
- **Keyboard Module:** Full shortcut mapping, arrow-key nudging with 500ms undo-merge, and accessibility focus navigation.
- **Export to PNG:** Pure SVG DOM serialization (`editor.exportPNG`) with chips on/off toggling and `view` vs `content` camera bounding.
- **Zero Runtime Dependencies:** Strictly zero dependencies outside `@open-draw/schema`.
