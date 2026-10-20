# Project Context

## Project Overview
`open-draw` is a modern canvas drawing and semantic visual editing ecosystem structured as a TypeScript/JavaScript monorepo.

## Monorepo Layout
- **Root**: npm workspaces managing `packages/*` and `apps/*`.
- **`packages/canvas`** (`@open-draw/canvas`): Core drawing and rendering engine. Strict zero-dependency library.
- **`packages/semantics`** (`@open-draw/semantics`): Semantic visual structures, AST, and diagram primitives. Strict zero-dependency library.
- **`packages/markdown`** (`@open-draw/markdown`): Markdown parsing, conversion, and interoperability layer. Strict zero-dependency library.
- **`apps/open-draw`** (`open-draw-app`): Application frontend / canvas UI shell.

## CI/CD & Automation
- **GitHub Repository**: [https://github.com/Chandu4221/open-draw](https://github.com/Chandu4221/open-draw)
- **Workflows**: Release-triggered automated publishing to npm using GitHub Actions (`publish.yml`) with actions v7 and `NPM_TOKEN` secret.
