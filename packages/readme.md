```
packages/
├── canvas/
│   └── src/
│       └── index.ts
├── contracts/
│   └── src/
│       └── index.ts
├── document/
│   └── src/
│       └── index.ts
├── export-markdown/
│   └── src/
│       └── index.ts
├── input/
│   └── src/
│       └── index.ts
├── profiles/
│   └── src/
│       └── index.ts
├── renderer-svg/
│   └── src/
│       └── index.ts
├── semantics/
│   └── src/
│       └── index.ts
├── shapes/
│   └── src/
│       └── index.ts
└── readme.md
```

---

| Package           | Responsibility                                                                | Progress | Should Be a pnpm Package?                     |
| ----------------- | ----------------------------------------------------------------------------- | -------- | --------------------------------------------- |
| `canvas`          | Core canvas engine, selection, pan, zoom, and interactions                    | Tested   | Yes — primary public SDK                      |
| `contracts`       | Shared types, interfaces, and extension contracts                             | Tested   | Yes — shared contracts                        |
| `document`        | Canonical document model, IDs, commands, history, transactions, serialization | Tested   | Yes — reusable core API                       |
| `export-markdown` | Structured Markdown export for AI and developer handoff                       | Tested   | Yes — optional export adapter                 |
| `input`           | Keyboard, pointer, and configurable input bindings                            | Tested   | Yes — input bindings & action registry        |
| `profiles`        | Platform profiles and visual styles                                           | Tested   | Yes — optional extension                      |
| `renderer-svg`    | SVG rendering pipeline and style overlays                                     | Tested   | Yes — renderer implementation                 |
| `semantics`       | UI semantic types, properties, and hierarchy                                  | Tested   | Yes — optional semantic layer                 |
| `shapes`          | Built-in rectangle, ellipse, line, and pen shapes                             | Tested   | Yes — optional extensions, bundled by default |

---

Progress legend: Not started → In progress → Implemented → Tested → Stable
