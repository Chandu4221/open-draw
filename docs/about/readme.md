# OpenDraw — Product Vision & Technical Blueprint

Consolidated concept draft · Product vision, architecture, extensibility, and development roadmap

OpenDraw is envisioned as an open-source, modular canvas SDK and visual design environment that lets developers build interactive wireframes, diagrams, UI prototypes, and semantically meaningful designs on a flexible canvas.

The core idea is to separate what an object is, how it behaves, how it looks, and what it means. A rectangle should remain a rectangle regardless of whether it is rendered as a standard shape, a hand-drawn sketch, or part of a semantic UI component. Developers should be able to use the canvas engine independently, while OpenDraw Studio can add higher-level capabilities for designing interfaces and preparing structured output for AI-assisted development.

The project should be designed for extensibility and long-term maintainability from the beginning—not by creating as many packages as possible, but by establishing clear ownership, stable contracts, and strict dependency boundaries.

## 1. The product has two complementary parts

[Canva vs. Figma: The 2024 UX/UI Design Tool Face-off](https://images.openai.com/static-rsc-4/H2CJYRVO8rk5wK-9oNCnDwuCBLT3myNgPM0KIr3_4jTw4iQpYdrLWCWtRuc3qfI7p6XPrKKyq6uFQJm4T8ONOuuYx2bKAYrksilmrg4WmghKa3ZepeOq-yVvBiUSGyit1ADWnOoeQDjk8xIj-yNS1uDCWt68vwS_B5pxTHfASdM?purpose=inline)

## A. OpenDraw Canvas SDK

The independent, reusable canvas engine.

- A browser-based canvas for any application.
- Drawing, selecting, moving, resizing, panning, and zooming.
- Undo/redo, serialization, and document manipulation.
- Standard shapes, custom SVG shapes, and extensible rendering.
- A plugin and capability system for adding features without modifying the core.

[Penpot UI design software: A beginner’s guide](https://images.openai.com/static-rsc-4/qZqMsRl9mNKIIjI1KawaGUZRMX6YCq6nMIdACK2HlcPo5Mu6TyHHw3veHfln8DgJpmuj_tM5wIRnrC5bw6pnZLMcqqFGA8l910EwVArJp8U1dT6_R_fPz5A5DzUnuil6xPShFQUZg9zgriLN5-GQYq5j_eU2iEjPNrz5zpO7akw?purpose=inline)

## B. OpenDraw Studio

The higher-level design and wireframing application built on the SDK.

- Visual UI wireframing and semantic annotations.
- Properties inspector, layer hierarchy, and region-based profiles.
- Platform-aware design specifications and visual styles.
- Human-readable Markdown export for AI-assisted implementation.
- Visual labels and optional semantic overlays on the canvas.

The distinction is fundamental: the SDK must be useful even if a developer never installs Studio or uses any semantic UI features.

## 2. Core design principles

1. Framework-independent core. Canvas behavior and document logic must not depend on React.
2. Canonical document state. The document model—not the SVG DOM, inspector, or exported Markdown—is the source of truth.
3. Independent capabilities. Shapes, renderers, input bindings, semantic features, and export formats should evolve through defined interfaces.
4. Composable extensions. Developers should be able to add or replace functionality without forking the engine.
5. Typed and validated contracts. Shared APIs should be explicit, type-safe, and validated at meaningful runtime boundaries.
6. Separation of identity and appearance. Shape geometry, semantic meaning, and rendering style must not be tangled together.
7. Production-minded from day one. Build, typecheck, tests, documentation, versioning, and compatibility policies are part of the architecture—not cleanup for later.
8. Practical modularity. A module deserves its own package when it has a clear responsibility, stable contract, and useful independent lifecycle.

## 3. The canvas engine

The canvas is the foundation of OpenDraw. It should provide the common infrastructure required to create and manipulate visual objects without forcing developers to use a particular UI framework or semantic design system.

### 3.1 Built-in interactions

The first useful SDK release should include:

- Create shapes by dragging on the canvas.
- Select one or multiple objects.
- Move, resize, and transform objects.
- Pan the viewport and zoom in or out.
- Delete, duplicate, copy, and paste objects where supported.
- Undo and redo through transactional history.
- Serialize and restore documents.
- Support selection handles, hover states, and interaction feedback.
- Provide configurable keyboard and pointer bindings.
- Support custom shapes and rendering extensions.

The built-in experience should be batteries-included. Installing `@opendraw/canvas` should give developers a working canvas with standard shapes, default input behavior, history, and essential interactions. Developers should not need to manually assemble ten packages just to draw a rectangle.

### 3.2 Initial shape library

[Rectangle Outline SVG, PNG , Digital Download - Etsy](https://images.openai.com/static-rsc-4/OkzetSEcBFFJO2_F9W3cjf2T3sagmR2uUKiS7aST-HMF1f5DBapdRmfObVOo-gIPB7XJlXZ1RN3bbflvWHxJsKd4xHecP3AakW0RnQlCkOIKNTuLdUitPH_sVtf_Ewqlxa9J3yLEJEZeSgPXDqsD7nYHKu12anG27oHbSg4R1Z8?purpose=inline)

Rectangle

Position, dimensions, fill, stroke, corner radius.

[Download Thin Line Circle Logo Template Vector Free | Logowik](https://images.openai.com/static-rsc-4/HKpIZ3ai1hChM4wUw2Jh1YXDrwNQxFx3JFPCFBzpH2Gs9iuvkSv8dmD8WYObh_RTVCM8vCrARL31lDaHWgGQz0kvaOhX-RnutHVSwIlGHeklfeocCpPRTqLOBYLA4rY0bmIYv5YLV_3GrnUfVuD_o2RG4JpWaa3KdpYegmLQc7s?purpose=inline)

Ellipse / circle

Center or bounding-box geometry, fill, and stroke.

[Free Vectors | Curved hand-drawn brush lines/black](https://images.openai.com/static-rsc-4/EwuDbmSmxtlaJkcoMIVIJL0y0642jdCF43BgtSYCoqspQeUmHFZoHWscGNM9HDJ1ZmPjv8bnXsFBKSKR6P06YykLeQPQRn071m6fbOWJnMVz5CbgTwWB17W0NemFAX-xXbJWT5hIqs9cd2WscIzsBLHThu2DSeshp8YqKio5Xug?purpose=inline)

Pen path

Path data, control points, and optional path-editing capability.

[прямая линия на прозрачном фоне 28 фото](https://images.openai.com/static-rsc-4/JtjetA9TvAmd4q9GzYBhXnvj8UqNwNDKZxxtP0AG4Iw7s5lUHIAewv3X07oYmKOIVyagjIrPRUYJ1Kyr7_Y-yt2xaxpbXfB6BTOftUGOcEOd_oPjOyWjOgzJICfGoJvSeCeFSXcZC1C1PSInA6tnn_Q6vU2SCCuMRmBCBIj7Vo8?purpose=inline)

Line

Endpoints, stroke properties, and future connector support.

These shapes are the initial baseline, not the limit of the engine. Custom SVG-backed shapes should be possible through a documented extension API.

### 3.3 One common shape contract, optional capabilities

Every shape should participate in a shared lifecycle, but not every shape should be forced to implement every behavior.

For example:

- A rectangle supports bounding-box selection and resizing.
- A pen path may support editing individual points and Bézier handles.
- A text shape may support inline text editing.
- A connector may support endpoint attachment and routing.
- A custom shape may supply its own geometry, hit-testing rules, or inspector capabilities.

The shared contract should describe common identity, geometry, serialization, and lifecycle requirements. More specialized behavior should be exposed through explicit capabilities.

This avoids a large, rigid interface full of methods that many shapes cannot meaningfully implement.

### 3.4 Geometry and rendering are separate

The document stores typed geometry and visual properties. A renderer converts that information into SVG output.

The SVG DOM is a rendering result, not the canonical document. Direct DOM manipulation must not become an alternative way to modify document state.

This separation enables:

- Multiple renderers for the same shape.
- Predictable document serialization.
- Rendering without React.
- Consistent undo/redo behavior.
- Future export to SVG, images, or other supported formats.

## 4. The document and state architecture

OpenDraw should have one canonical document model, with other systems operating as projections or controlled mutations of that model.

### 4.1 Four categories of state

1\. Persistent document state

Shapes, IDs, geometry, visual properties, hierarchy, semantic metadata, profiles, and document-level settings.

2\. Transient interaction state

Current selection, active tool, pointer position, drag preview, active handles, and in-progress gestures.

3\. Resolved state

Computed values such as inherited profile settings, effective properties, constraints, and resolved semantic metadata.

4\. Presentation state

Renderer-specific output, selection decorations, semantic chips, hover effects, and other visual overlays.

These categories should have clear ownership and lifetimes. For example, a temporary selection rectangle should not be serialized as a permanent shape, and a semantic chip should not need to be stored as a separate SVG object in the document.

### 4.2 Commands, transactions, and history

Mutations should go through typed commands or equivalent controlled document operations.

Examples include:

- `CreateShape`
- `MoveShapes`
- `ResizeShape`
- `DeleteShapes`
- `UpdateShapeProperties`
- `AssignSemanticType`
- `AssignProfile`
- `ReparentShapes`

A command should describe a meaningful change, apply it through the document mutation layer, and provide enough information for history to undo and redo it safely.

Related operations should be grouped into transactions. Dragging an object, for instance, should not create hundreds of unrelated history entries.

The architecture should also provide reactive selectors or subscriptions so the canvas, inspector, layer panel, and other consumers can observe relevant changes without duplicating the document.

### 4.3 Interaction state machines

Complex interactions should use explicit state transitions rather than scattered booleans and unrelated event handlers.

Potential states include:

- Idle
- Drawing a shape
- Dragging selected objects
- Resizing
- Editing a path
- Panning
- Editing text

A state machine helps ensure that a pointer-up event, cancellation, undo operation, or tool switch behaves predictably in every interaction.

### 4.4 Input bindings are not actions

The input system should map keyboard and pointer events to named actions. It should not own the implementation of those actions.

For example:

- `Ctrl` + mouse wheel may invoke a zoom action.
- Space + drag may invoke a pan action.
- Delete may invoke a delete-selection action.
- A user may remap the same action to different inputs.

The binding layer recognizes the gesture and invokes the action. The canvas interaction system performs the zoom, pan, or deletion. This separation makes defaults configurable and avoids tying business behavior to keyboard handlers.

## 5. Rendering architecture and visual styles

OpenDraw should support different visual appearances without changing the underlying shape identity or geometry.

### 5.1 Standard renderer and style extensions

The standard SVG renderer should be the default. Other renderers or style extensions can customize how supported shapes appear.

For example, the same rectangle could be displayed as:

- A conventional vector shape.
- A hand-drawn, crayon-like outline.
- A glass-like UI panel.
- A rough sketch.
- A style supplied by a third-party plugin.

The choice of renderer should not silently transform the rectangle into a different semantic object or rewrite its canonical geometry.

### 5.2 Crayon-style rendering

A hand-drawn or crayon style is a rendering extension, not a special kind of shape.

It should support:

- Deterministic, seeded visual variation.
- Consistent rendering of the same document and style settings.
- Shape-specific rendering where necessary.
- A fallback to the standard renderer for unsupported capabilities.
- Separate custom illustration assets when generic shape rendering is insufficient.

For example, a generic circle rendered with a crayon style should remain a circle in the document. A hand-drawn character illustration, however, may be a custom SVG asset or specialized shape rather than an automatically generated circle.

### 5.3 Renderer contracts

A renderer should declare which shape types and capabilities it supports. The engine should validate extensions and provide a defined fallback when a renderer cannot handle an object.

The rendering system should also distinguish actual document geometry from decorative effects. A rough visual outline should not unpredictably alter selection, hit testing, or resize handles unless the extension explicitly supplies corresponding geometry or interaction behavior.

## 6. Semantic wireframing

The semantic layer is the bridge between a generic visual canvas and a meaningful UI design.

It should be an optional capability built on top of the canvas, not a mandatory dependency of the core engine.

### 6.1 Semantic metadata

A shape may have:

- A semantic type, such as `button`, `navbar`, `card`, or `input`.
- A user-defined name, such as `Primary CTA` or `Account Header`.
- Custom properties relevant to that type.
- Parent-child relationships.
- A reference to a design profile.
- Local overrides to inherited settings.

The semantic system should not assume that every rectangle is a button or that every circle is an icon. Geometry alone is insufficient to determine meaning reliably.

### 6.2 Custom names and visual chips

Shapes can display a small semantic overlay or chip.

The label-selection rule should be straightforward:

1. Show the custom name if one has been provided.
2. Otherwise, show the semantic type if one exists.
3. If neither exists, show no semantic label.

These labels should be presentation overlays, not separate document shapes. The export system should be able to include or exclude them according to the selected export options.

### 6.3 Semantic properties

Different semantic types can expose different property sets.

For example:

- A navbar could have a positioning mode such as sticky, fixed, or docked.
- A button could have a variant such as primary, secondary, or icon-only.
- An input could expose a placeholder, input type, and required state.
- A card could expose content roles, padding, and layout properties.

The semantic schema should define valid properties and values. The inspector should derive its controls from those definitions rather than hardcoding a separate form for every semantic type.

The same extensibility model should allow third-party packages to register additional semantic types and properties.

## 7. Platform profiles and style profiles

OpenDraw should distinguish the target platform from the visual style. They are related but different concepts.

### 7.1 Platform profiles

Platform profiles describe the conventions and implementation context for a design.

Examples include:

- Web
- Android with Material 3
- Flutter-based applications

A platform profile may define relevant component conventions, sizing guidance, supported properties, or export mappings. It should not force the underlying canvas to use a particular platform.

### 7.2 Style profiles

Style profiles describe the visual language of a design.

Examples include:

- Minimal
- Glassmorphism
- Brutalism
- Crayon or hand-drawn
- Other user-defined styles

A style profile may define colors, typography, stroke treatment, spacing conventions, and rendering preferences where applicable.

### 7.3 Profiles belong to regions, not the entire canvas by default

The canvas itself should remain neutral. A user can assign a platform profile and style profile to a top-level region or group of shapes.

Descendants inherit applicable settings unless they define explicit overrides.

Canvas

Neutral workspace; no mandatory design profile.

Region A — Web / Minimal

Children inherit the region's effective settings.

Navbar — inherits both profiles

Primary button — overrides its visual style

Region B — Android / Material 3

A separate design context can coexist in the same document.

This enables multiple screens or design contexts within one canvas. The inheritance rules should be explicit, deterministic, and inspectable; a child override should not accidentally rewrite the parent profile.

A region may use a platform profile without a style profile, or a style profile without a platform profile. Profiles should compose only where their definitions and conflict-resolution rules allow it.

## 8. Plugin and capability system

The plugin system should be a first-class architectural capability, not an afterthought.

Plugins should extend OpenDraw through defined contracts rather than importing internal implementation details or modifying core files.

### 8.1 What plugins can contribute

Shape definitions

New geometry types, shape schemas, lifecycle hooks, and serialization support.

Renderers

Alternative SVG rendering, style systems, and supported shape-specific visual treatments.

Inspector fields

Property definitions and UI controls associated with semantic types or shapes.

Interactions

Additional tools, gestures, path editing, and custom actions.

Validators

Rules that validate document properties, plugin data, and semantic constraints.

Export mappings

Mappings to Markdown, SVG, or future implementation-oriented formats.

Profiles and semantics

New platform profiles, visual styles, semantic types, and property schemas.

### 8.2 Plugin compatibility and safety

Every extension should have:

- A namespaced identifier.
- A versioned contract.
- Defined capabilities and dependencies.
- Registration-time validation.
- Clear conflict-resolution rules.
- Compatibility checks and meaningful errors.
- A documented fallback when an optional extension is unavailable.

The document should preserve unknown plugin-owned data when possible. Opening a document without a particular plugin must not silently delete that plugin's properties.

Preservation is not the same as interpreting unknown data: the core may retain an opaque payload without understanding its meaning. Any operation that rewrites or migrates that payload should be deliberate.

Plugins should be treated as potentially untrusted extensions. The architecture should define which capabilities are permitted and avoid granting unrestricted access to the document, browser, or application internals by default.

## 9. AI-assisted design handoff and Markdown export

OpenDraw Studio should make it possible to move from a visual wireframe to a structured description that can be consumed by a developer or AI coding assistant.

Markdown is a derived export format, not the canonical storage format.

The export should be human-readable and preserve relevant information such as:

- Screen and region structure.
- Shape hierarchy and custom names.
- Semantic types and component variants.
- Important layout and sizing properties.
- Platform and style profiles.
- Component relationships and interaction intent.
- Explicit overrides and relevant constraints.
- Referenced assets and supported implementation hints.

For example, a region containing a navbar, heading, form, and primary button could export a structured description of the screen and its components rather than a raw list of SVG elements.

The export system should support clear formatting rules and deterministic output where practical. That makes generated Markdown easier to review, diff, version, and feed into AI-assisted implementation.

Future export adapters could map the same semantic document to framework-specific or platform-specific descriptions without forcing the core canvas to depend on those targets.

## 10. React integration and framework independence

The canvas engine should be usable without React. React is an adapter and integration option, not the foundation of the drawing system.

OpenDraw Studio

React application, editor shell, inspector, and panels

React adapter — `@opendraw/react`

Lifecycle, props, hooks, and subscriptions

Canvas engine — `@opendraw/canvas`

Document operations, interactions, history, input, and rendering coordination

Framework-independent contracts and document model

Typed objects, geometry, commands, serialization, and extension contracts

The React adapter should handle mounting, disposal, configuration, and state subscriptions. It should not reimplement selection, geometry calculations, history, or drawing logic.

React should be an optional peer dependency of the adapter. Other integrations should be possible through other adapters or direct use of the engine.

For the initial Studio, React with Vite is a practical choice for a browser-first interactive application. Next.js or server-side rendering can be evaluated later if the product develops a concrete need for them.

## 11. Monorepo structure and package boundaries

The project should use pnpm workspaces. Turbo can coordinate builds and tests as the workspace grows.

A possible target structure is:

```
open-draw/
├── apps/
│   ├── studio/                 # Main visual design application
│   └── playground/             # SDK demos and examples
├── packages/
│   ├── contracts/              # Shared public interfaces and types
│   ├── document/               # Canonical model and serialization
│   ├── commands/                # Typed mutations and transactions
│   ├── history/                 # Undo/redo infrastructure
│   ├── canvas/                  # Batteries-included engine
│   ├── renderer-svg/             # SVG rendering implementation
│   ├── shapes/                  # Built-in shape definitions
│   ├── input/                   # Input bindings and actions
│   ├── react/                   # React adapter
│   ├── semantics/               # Semantic types and schemas
│   ├── profiles/                # Platform and visual profiles
│   └── export-markdown/         # Structured Markdown export
├── tooling/
│   └── eslint-config/
├── docs/
│   ├── architecture/
│   ├── decisions/
│   └── contracts/
├── tests/
│   └── e2e/
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json
├── turbo.json
└── eslint.config.js
```

This is a target architecture, not a requirement to create every package immediately. Some modules can begin as internal directories and become published packages when their boundaries and APIs stabilize.

### 11.1 Intended dependency rules

| Module                 | Owns                                             | Must not depend on              |
| ---------------------- | ------------------------------------------------ | ------------------------------- |
| Contracts and document | Types, geometry, schema, serialization           | React, SVG DOM, Studio          |
| Commands and history   | Controlled mutations and reversible transactions | Studio UI                       |
| Canvas                 | Coordination of core interactions and rendering  | Semantic layer being mandatory  |
| SVG renderer           | Visual output from document state                | DOM as canonical state          |
| React adapter          | React lifecycle and integration                  | Reimplemented engine logic      |
| Semantics and profiles | Semantic metadata, profiles, inheritance         | Canvas implementation internals |
| Export adapters        | Transformations to target formats                | Being the source of truth       |

Dependencies should flow through explicit contracts. Avoid circular dependencies, hidden imports into another package's internal files, and broad shared utility packages that become dumping grounds.

### 11.2 Public API strategy

The primary developer-facing package should be `@opendraw/canvas`, which provides the basic working experience.

Other packages can be published when their separate installation provides real value—for example, `@opendraw/react` or `@opendraw/semantics`.

Internal packages such as history or low-level input infrastructure do not need to become public just because they exist in the source tree. Stable APIs and compatibility commitments should determine publication.

## 12. Development stack and engineering standards

The initial repository should remain simple enough to develop quickly, while having the engineering discipline needed for a reusable SDK.

| Area                | Proposed choice                    | Purpose                                          |
| ------------------- | ---------------------------------- | ------------------------------------------------ |
| Language            | TypeScript                         | Strong contracts and developer experience        |
| Workspace           | pnpm                               | Dependency and package management                |
| Build orchestration | Turbo                              | Coordinated builds and tests                     |
| Studio              | React + Vite                       | Browser-first editor                             |
| Rendering           | SVG                                | Vector shapes and scalable rendering             |
| Unit testing        | Vitest                             | Document, command, geometry, and extension tests |
| Browser testing     | Playwright                         | Real canvas interactions and Studio workflows    |
| Linting             | ESLint                             | Code quality and consistency                     |
| Formatting          | Prettier                           | Consistent formatting                            |
| Runtime validation  | Zod or an equivalent schema system | Validate documents and plugin boundaries         |

The exact dependency versions should be pinned and verified together. The repository should have a consistent Node.js and pnpm version, reproducible lockfile, automated CI checks, and a documented release process.

Strict TypeScript settings should include options such as `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `noImplicitOverride` where practical.

### Testing strategy

Tests should protect the contracts and behavior that make the SDK reliable.

- Unit tests: geometry, shape definitions, commands, history, schema validation, and profile inheritance.
- Contract tests: shape and renderer extensions behave according to their declared interfaces.
- Integration tests: selection, dragging, resizing, rendering, serialization, and history work together.
- End-to-end tests: users can create, edit, save, reload, and export a document through Studio.
- Compatibility tests: older documents and unavailable plugins are handled according to documented migration and preservation rules.

A useful first milestone is a clean install followed by successful typechecking, linting, tests, and builds. These checks should run automatically in CI.

## 13. Initial repository and development status

The current repository has the beginning of the infrastructure:

- A pnpm monorepo layout.
- A React + TypeScript Vite scaffold in `apps/studio`.
- Root-level TypeScript, ESLint, and Turbo configuration.
- Directories for packages, documentation, and end-to-end tests.

The Vite scaffolding issue was resolved by using `create-vite@9.3.1` rather than the failing `9.3.2` invocation.

This is a starting point, not evidence that the complete application or architecture has been implemented. The next engineering step is to verify the install and build, align workspace scripts, and replace the starter UI with a minimal OpenDraw Studio shell.

## 14. Development roadmap

## 01

Workspace stabilization

First priority

Verify pnpm installation, workspace discovery, package scripts, TypeScript configuration, linting, and the initial Studio build. Add CI and basic architectural documentation.

## 02

Minimal working canvas

Implement the document model, rectangle and ellipse shapes, SVG rendering, selection, drag-to-draw, moving, resizing, panning, and zooming. Keep the first implementation small but properly separated.

## 03

Document operations and SDK

Add typed commands, transactions, undo/redo, serialization, configurable input bindings, and a stable public API for the batteries-included canvas.

## 04

Extension system

Formalize shape capabilities, custom SVG renderers, plugin registration, validation, and fallback behavior. Test extensions independently of Studio.

## 05

Semantic wireframing

Add semantic types, custom names, inspector schemas, hierarchy, labels, platform profiles, style profiles, and inherited settings.

## 06

Export and visual extensions

Introduce Markdown handoff, configurable semantic overlays, crayon rendering, custom illustration support, and additional platform or framework export adapters.

## 07

SDK stabilization and ecosystem

Publish packages with stable APIs, document extension development, establish versioning and migration policies, and build examples that demonstrate standalone use.

These milestones are a proposed order, not fixed release commitments. Semantic design and advanced rendering should not delay the delivery of a small, reliable core canvas.

## 15. Architectural decisions to preserve

The following decisions should guide future implementation discussions:

- The canvas engine must work without React.
- Studio must consume the SDK rather than duplicate its core behavior.
- SVG is a rendering format, not the source of truth.
- Shape identity, geometry, semantic meaning, and rendering style remain separate.
- Semantic features and platform profiles are optional extensions.
- The core does not infer semantic meaning from shape geometry by default.
- Input bindings invoke actions; they do not implement the actions themselves.
- All persistent mutations follow controlled document operations and participate in history where appropriate.
- Unknown plugin data should be preserved where possible.
- Profile inheritance and overrides must be deterministic.
- Markdown is a derived, human-readable export—not the canonical document format.
- Package boundaries must enforce actual dependency rules rather than simply organize files.
- New public packages and extension APIs should be introduced when they have a well-defined purpose and sufficient tests.

## 16. What success looks like

A developer should be able to install OpenDraw's canvas package, create a canvas, draw and manipulate shapes, save the document, restore it later, and extend the engine—all without needing the OpenDraw Studio application.

Separately, a designer should be able to use Studio to create a wireframe, label its components semantically, assign platform and style profiles to regions, inspect component properties, and export a structured description suitable for human or AI-assisted implementation.

Third-party developers should be able to introduce new shapes, renderers, semantic types, inspector fields, profiles, and exporters without changing the core engine.

The ultimate goal is a reusable canvas platform with a semantic design workflow built on top—not a single-purpose wireframing app whose internals cannot be reused.

That distinction should remain the guiding principle as OpenDraw grows.
