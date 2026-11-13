# OpenDraw Studio

A semantic wireframing and design studio built on the [@open-draw/canvas](https://github.com/Chandu4221/open-draw-canvas) SDK.

> **Status:** Alpha. APIs and document schemas are in active development and subject to change.

## Features

- **Built on Standalone Canvas SDK:** Powered by `@open-draw/canvas` on npm — a framework-free, batteries-included vector canvas engine with zero runtime dependencies.
- **Semantic Wireframing:** Platform profiles (Web, Android Native, Flutter, iOS) with dynamic semantic tags, device visibility filters, and visual chip overlays.
- **Structured Markdown Export:** Hierarchical document export generating Markdown specifications with semantic annotations for AI-assisted implementation.
- **Pluggable Vector Rendering:** SVG rendering pipeline supporting presentation styles (minimal clean lines and deterministic hand-drawn crayon style) without altering underlying geometry.
- **Transactional Document State:** Pure document mutations, undo/redo history, and hierarchical parenting.

## Packages

- **`@open-draw/canvas`**: External dependency on npm (`npm install @open-draw/canvas`). Standalone vector drawing canvas SDK.
- **Internal Modules**: Proprietary semantics, platform profiles, export prompt compilers, and Studio UI (`apps/studio`).

## Getting Started

### Prerequisites

- Node.js >= 22
- pnpm >= 11

### Installation

```bash
pnpm install
```

### Running Locally

To launch the development server for the Studio app:

```bash
pnpm dev
```

- Studio: `http://localhost:5173` (or next available port)

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
