# OpenDraw

A modular, framework-agnostic vector canvas SDK and semantic wireframing engine.

> **Status:** Alpha. APIs and document schemas are in active development and subject to change.

## Features

- **Framework-Agnostic Canvas Controller:** Interaction state machine handling shape creation, selection, translation, corner and edge resizing, viewport panning, and zooming with zero DOM or UI framework dependencies.
- **Reactive Controller Events:** Typed event subscriptions (`documentChanged`, `selectionChanged`, `historyChanged`, `cameraChanged`, `toolChanged`, `machineChanged`) allowing host shells to observe changes with zero global state.
- **Canonical Document Model:** Pure, immutable document tree supporting transactional commands, history tracking (undo/redo), hierarchical nesting, and JSON serialization.
- **Pluggable Vector Rendering:** SVG rendering pipeline supporting presentation styles (minimal clean lines and deterministic hand-drawn crayon style) without altering underlying geometry.
- **Semantic Wireframing:** Platform profiles (Web, Android Native, Flutter, iOS) with dynamic semantic tags, device visibility filters, and visual chip overlays.
- **Structured Markdown Export:** Hierarchical document export generating Markdown specifications with semantic annotations for AI-assisted implementation.

## Packages

- **`@open-draw/canvas`**: Published on npm (`npm install @open-draw/canvas`). Standalone, batteries-included vector drawing canvas with zero runtime dependencies.
- **Internal Modules**: Proprietary semantics, platform profiles, export prompt compilers, and Studio UI remain private.

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

- **Hierarchical Containers Only (No Arbitrary Grouping):** Composition is managed through semantic containers (Pages and Sections); freeform shape grouping (`group` shape) is not implemented.
- **Single-Line Plain Text:** Text shapes support plain UTF-8 text editing; rich-text styling (bold, italics, lists) and arbitrary rotation are declared non-goals.

## License

MIT License. Copyright (c) 2026 Chandra Shekhar. See [LICENSE](LICENSE) for details.
