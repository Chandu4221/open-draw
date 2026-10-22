# Changelog

All notable changes to `@open-draw/canvas` are documented in this file in adherence to Semantic Versioning.

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
