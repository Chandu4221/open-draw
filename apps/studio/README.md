# OpenDraw Studio

OpenDraw Studio is the reference wireframing and design-intelligence application built on the OpenDraw platform (React 19, Vite).

Studio mounts and drives its viewport directly through `@open-draw/canvas`'s `createEditor`, dogfooding the framework-free canvas engine for visual drawing, selection, and camera controls while layering OpenDraw's proprietary capabilities:

- Semantic wireframing and responsive device form-factors (`@open-draw/semantics`).
- Platform design systems and target profiles (`@open-draw/profiles`).
- AI-directed markdown, JSON, and SVG/PNG document export (`@open-draw/export-markdown`, `@open-draw/renderer-svg`).
- Unified UI design tokens and components (`@open-draw/ui`).

## Development

Run the development server:

```bash
pnpm --filter studio dev
```

Build the application for production:

```bash
pnpm --filter studio build
```

Run test suite:

```bash
pnpm --filter studio test
```
