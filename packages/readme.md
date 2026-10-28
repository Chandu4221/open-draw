```
packages/
├── contracts/
│   └── src/
│       └── index.ts
├── document/
│   └── src/
│       └── index.ts
├── canvas/
│   └── src/
│       └── index.ts
└── README.md
```

---

| Package           | Responsibility                                             | Progress    | Should Be a pnpm Package?                     |
| ----------------- | ---------------------------------------------------------- | ----------- | --------------------------------------------- |
| `contracts`       | Shared types, interfaces, and extension contracts          | Not started | No — keep internal initially                  |
| `document`        | Canonical document model, IDs, and serialization           | Not started | Yes — reusable core API                       |
| `commands`        | Typed document mutations                                   | Not started | No — internal initially                       |
| `history`         | Undo/redo and transaction management                       | Not started | No — internal initially                       |
| `canvas`          | Core canvas engine, selection, pan, zoom, and interactions | Not started | Yes — primary public SDK                      |
| `renderer-svg`    | SVG rendering pipeline                                     | Not started | No — internal initially                       |
| `shapes`          | Built-in rectangle, ellipse, line, and pen shapes          | Not started | Yes — optional extensions, bundled by default |
| `input`           | Keyboard, pointer, and configurable input bindings         | Not started | No — internal initially                       |
| `react`           | Optional React integration adapter                         | Not started | Yes — framework-specific adapter              |
| `semantics`       | UI semantic types, properties, and hierarchy               | Not started | Yes — optional semantic layer                 |
| `profiles`        | Platform profiles and visual styles                        | Not started | Yes — optional extension                      |
| `export-markdown` | Structured Markdown export for AI and developer handoff    | Not started | Yes — optional export adapter                 |

---

Progress legend: Not started → In progress → Implemented → Tested → Stable
