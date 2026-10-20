# Architecture & Design Principles

## Core Tenets
1. **Zero-Dependency Libraries**: Core packages (`@open-draw/canvas`, `@open-draw/semantics`, `@open-draw/markdown`) must maintain strict zero external runtime dependencies to ensure maximum portability, minimal bundle size, and long-term maintainability.
2. **Clear Separation of Concerns**:
   - `canvas`: Rendering, coordinate systems, shapes, transformation matrices, event dispatching.
   - `semantics`: Domain models, graph/tree connections, semantic nodes, schema definitions.
   - `markdown`: Bidirectional translation between semantic diagrams and markdown representations.
   - `apps/open-draw`: Interactive UI shell, toolbars, user preferences, persistence, state management.
3. **Extensibility**: Design extensible APIs suitable for both browser canvas consumption and headless execution (e.g. server-side rendering or CLI exports).
