# OpenDraw Architecture Overview

This document describes the architectural principles, package boundaries, and data flow of OpenDraw.

## 1. Core Principles

- **R-004 — Two Products, One Rule**: `@open-draw/canvas` is useful standalone without Studio. Studio consumes the canvas SDK and duplicates no core engine behavior.
- **R-008 — Functional Core, Imperative Shell**: Document operations, transaction commits, validation, and layout calculations are pure functions over immutable data. Side effects (DOM listeners, timers, rendering) live in thin imperative shells.
- **R-016 — Document is Single Source of Truth**: The document model is canonical; SVG markup is a derived rendering projection. The canvas controller never caches its own second source of truth. Mutations execute via typed commands only.
- **R-020 — Mechanically Enforced Package Boundaries**: Dependency rules are verified by dependency-cruiser and ESLint in CI.

## 2. Package Dependency Hierarchy

```
contracts (pure types & constants, zero dependencies)
   │
   ├── document (tree, commands, history, transactions, validation)
   │      │
   │      ├── input (keyboard actions, key bindings, gestures)
   │      │      │
   │      │      └── canvas (camera, selection, hit-testing, machine)
   │      │
   │      ├── renderer-svg (SVG generation, style overlays, export)
   │      │
   │      └── semantics (semantic resolution, conflicts, display names)
   │             │
   │             └── export-markdown (AI prompt & markdown compilation)
   │
   └── profiles (web, android-native, flutter, ios platform profiles)
```

## 3. Package Responsibilities

| Package                      | Purpose                                                           | Permitted Dependencies                                     |
| :--------------------------- | :---------------------------------------------------------------- | :--------------------------------------------------------- |
| `@open-draw/contracts`       | Pure interfaces, branded IDs, and `as const` registries           | _None_                                                     |
| `@open-draw/document`        | Canonical document model, immutable tree, transactions, history   | `contracts`                                                |
| `@open-draw/input`           | Input event mapping, keybindings, gesture states                  | `contracts`                                                |
| `@open-draw/canvas`          | Camera (pan/zoom), selection, hit-testing, public SDK entry point | `contracts`, `document`, `input`, `renderer-svg`, `shapes` |
| `@open-draw/renderer-svg`    | Deterministic SVG string generator, chip and handle overlays      | `contracts`, `document`                                    |
| `@open-draw/semantics`       | Semantic resolution against platform profiles, conflict detection | `contracts`, `document`, `profiles`                        |
| `@open-draw/export-markdown` | Markdown specification and AI prompt generator                    | `contracts`, `document`, `semantics`                       |
| `@open-draw/ui`              | Shared UI tokens, components, icons, and toast system             | React, `contracts`                                         |
| `apps/studio`                | Proprietary web application and vector wireframing studio         | Workspace packages, React                                  |
| `apps/playground`            | Internal local developer testbed and experimental workbench       | Workspace packages, React                                  |

## 4. Distribution Boundaries

- **Public Distribution**: `@open-draw/canvas` is published to npm with zero runtime external dependencies (ADR-0008).
- **Private Core**: Proprietary semantic wireframing engines, platform profiles, AI prompt compilers, UI design systems, and Studio application remain closed-source (ADR-0009).
