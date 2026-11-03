# OpenDraw

A modular, framework-agnostic vector canvas SDK and semantic wireframing engine.

> **Status:** Alpha. APIs and document schemas are in active development and subject to change.

## Features

- **Framework-Agnostic Canvas Controller:** Interaction state machine handling shape creation, selection, translation, corner and edge resizing, viewport panning, and zooming with zero DOM or UI framework dependencies.
- **Canonical Document Model:** Pure, immutable document tree supporting transactional commands, history tracking (undo/redo), hierarchical nesting, and JSON serialization.
- **Pluggable Vector Rendering:** SVG rendering pipeline supporting presentation styles (minimal clean lines and deterministic hand-drawn crayon style) without altering underlying geometry.
- **Semantic Wireframing:** Platform profiles (Web, Android Native, Flutter) with dynamic semantic tags, device visibility filters, and visual chip overlays.
- **Structured Markdown Export:** Hierarchical document export generating Markdown specifications with semantic annotations for AI-assisted implementation.

## Getting Started

### Prerequisites

- Node.js >= 22
- pnpm >= 11

### Installation

```bash
pnpm install
```

### Running Locally

To launch the development servers for the Playground and Studio apps:

```bash
pnpm dev
```

- Playground: `http://localhost:5176` (or next available port)
- Studio: `http://localhost:5175` (or next available port)

### Verification

To run formatting checks, linters, dependency cruise, naming checks, typechecking, tests, and builds:

```bash
pnpm check
```

## Current Limitations

- **SDK Packages Not Published:** Packages are internal workspace packages and not yet published to npm (ruling V5).
- **No Change-Notification Events:** The canvas controller does not emit reactive change-notification events; consumer shells manage renders on dispatch boundaries (ruling V7).
- **No Text Shape Kind:** Text labels are rendered via shape metadata labels and semantic chips; there is no standalone freeform text shape kind.
- **No Grouping:** Hierarchical composition is managed via container shapes (Pages and Sections); arbitrary grouping (`group` shape) is not implemented.

## License

MIT License. Copyright (c) 2026 Chandra Shekhar. See [LICENSE](LICENSE) for details.
