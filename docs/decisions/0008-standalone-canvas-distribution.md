# ADR-0008 — Standalone Canvas Packaging & Distribution

- **Status:** Accepted
- **Date:** 2026-11-05
- **Supersedes:** amends ADR-0001 D2 and ADR-0003 D6 (dependency table)
- **Rules implemented:** R-002, R-004, R-005, R-010, R-014, R-016, R-020, R-036

## Context

OpenDraw ships two distinct offerings (R-004, ADR-0001 D1):

1. **The Canvas SDK**: A batteries-included, framework-free visual drawing canvas with built-in shapes, document transactions, history, SVG rendering, and keyboard interaction.
2. **OpenDraw Studio**: A complete wireframing and design-intelligence application with semantics, platform profiles, and AI-directed markdown export.

Currently, `@open-draw/canvas` and all workspace packages are unpublished and marked `"private": true`, exporting raw TypeScript source directly. An external developer cannot install `@open-draw/canvas` via npm. Furthermore, `@open-draw/semantics`, `@open-draw/profiles`, `@open-draw/export-markdown`, and `@open-draw/ui` represent proprietary product capabilities intended exclusively for Studio.

To distribute `@open-draw/canvas` on npm while preserving R-002 (zero runtime dependencies) and protecting proprietary packages, a clear packaging, bundling, and boundary architecture is required.

## Decision

### D1 — Single batteries-included public package

- `@open-draw/canvas` is the single public package published to npm under `@open-draw/canvas`.
- The package inlines its internal workspace dependencies (`@open-draw/contracts`, `@open-draw/document`, `@open-draw/shapes`, `@open-draw/input`, `@open-draw/renderer-svg`) during build.
- The published package carries empty runtime dependencies (`dependencies: {}`), strictly satisfying **R-002**.
- Consumers require only `npm install @open-draw/canvas`.

### D2 — Proprietary packages remain strictly private

- `@open-draw/semantics`, `@open-draw/profiles`, `@open-draw/export-markdown`, and `@open-draw/ui` permanently retain `"private": true` in `package.json`.
- `npm publish` is mechanically prohibited from publishing them.
- CI/CD release workflows never upload or expose these packages to public registries.

### D3 — Updated dependency table (amends ADR-0003 D6)

`@open-draw/canvas` may now compose `@open-draw/shapes` and `@open-draw/renderer-svg` to provide default shape registrations and SVG export out-of-the-box:

| Package        | May depend on                                              | Must NEVER depend on                         |
| -------------- | ---------------------------------------------------------- | -------------------------------------------- |
| `contracts`    | —                                                          | anything                                     |
| `shapes`       | `contracts`                                                | `document`, `canvas`, `renderer`             |
| `document`     | `contracts`                                                | `shapes`, React, SVG/DOM, canvas             |
| `renderer-svg` | `contracts`, `document`                                    | canonical state (document is truth)          |
| `canvas`       | `contracts`, `document`, `input`, `shapes`, `renderer-svg` | semantics never mandatory; UI never imported |
| `input`        | `contracts`                                                | DOM, React                                   |

Mechanical enforcement in `.dependency-cruiser.cjs` ensures `@open-draw/canvas` can never import `@open-draw/semantics`, `@open-draw/profiles`, `@open-draw/export-markdown`, or `@open-draw/ui`.

### D4 — Default shape registrations in `createCanvas()`

- `createCanvas()` defaults to registering all built-in shapes (`rect`, `ellipse`, `line`, `pen-path`, `text`) via `DEFAULT_SHAPE_REGISTRATIONS` when `options.shapeKinds` is omitted.
- Custom shape registries passed to `options.shapeKinds` continue to override or extend the defaults without modification to the controller core.

### D5 — Bundled dual ESM/CJS build with rolled-up declarations

- The package uses `tsup` in devDependencies to produce:
  - `dist/index.js` (ESM)
  - `dist/index.cjs` (CommonJS)
  - `dist/index.d.ts` (complete rolled-up TypeScript declaration file)
- `package.json` configures standard `main`, `module`, `types`, and `exports` maps.

## Consequences

- External developers can install `@open-draw/canvas` with zero external dependencies and build a functioning visual canvas in minutes.
- Proprietary intelligence (semantics, design style profiles, prompt compiler) cannot leak to npm.
- Package boundaries remain lint-enforced and cycle-free.
