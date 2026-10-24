# OPENDRAW.md — Project Context

**You are building OpenDraw: a suite of small, independently publishable packages that together form a design-to-spec tool. This document is your primary context. Read it fully before writing any code.**

---

## 1. WHAT OPENDRAW IS

OpenDraw lets users draw wireframes on an infinite canvas, tag shapes with semantic meaning (this is a `card`, this is a `navbar`), and compile the annotated scene into a precise markdown specification that AI tools and developers can consume.

It is a **suite of LEGO blocks** — each package standalone, one-way dependencies, MIT, zero runtime dependencies:

```
open-draw/                            # monorepo (npm workspaces)
├── packages/
│   ├── canvas/      → @open-draw/canvas     — infinite DOM canvas engine
│   ├── semantics/   → @open-draw/semantics — shape meaning, parenting, platforms
│   └── markdown/     → @open-draw/markdown  — pure annotated-scene → markdown compiler
└── apps/
    └── studio/       → OpenDraw Studio      — the app that composes the three blocks
```

**Dependency arrows (one-way, CI-enforced):**

```
studio ──> canvas, semantics, markdown
markdown ──> semantics (types only)
semantics ─> canvas (types only; accepts any plain shape snapshot)
canvas ──> nothing
```

**Why this structure:** each block is independently useful and independently versioned. `canvas` alone is a whiteboard SDK. `semantics` alone is a tagging vocabulary usable with any drawing tool. `markdown` alone is a spec generator for any annotated scene. The app is a thin composition — it must contain **zero business logic**; logic found in the app that touches vocabulary or compilation belongs one package down.

## 2. THE ARCHITECTURAL CONVICTION (the soul of the project)

**Every shape is a real DOM/SVG element — never a pixel on a `<canvas>` bitmap.**

All consequences flow from this:
- **Overlays (labels, tags, chips) are DOM children of the shape's own group.** They inherit the canvas transform, so they *cannot* detach from their shape — not at 0.2× zoom, not at 5×, not mid-pan. This invariant is tested (see §4) and is the single most important acceptance bar in the project.
- Hit-testing is native browser hit-testing.
- Accessibility is real elements with real ARIA.
- The camera is one CSS/SVG transform on the root group; **all screen↔page math lives in exactly one file** (`camera.ts`). No code anywhere else multiplies by zoom.

## 3. THE PACKAGES IN ONE PARAGRAPH EACH

**@open-draw/canvas** — the engine. Shapes (rect, ellipse, text, frame, note, image, arrow, freehand ink) rendered as SVG; tools, selection, from-scratch resize/rotate handles, pan/zoom, undo/redo as a transaction stack, JSON snapshots + diff events, light/dark themes, PNG export, React and vanilla wrappers. Framework-free core; wrappers are thin. Zero runtime dependencies, forever.

**@open-draw/semantics** — the meaning layer. A canonical Type vocabulary with allow-lists; tagging state per shape; parent/child resolution (geometric containment from bounds, plus explicit overrides); responsive semantics (breakpoint visibility, ordering, primary flags, collapse modes); unit stamping; and **platform profiles** — typed data modules under `platform/` (`web.ts`, `android.ts`, `flutter.ts`, …) that supply platform-specific aliases and extra types. Adding a platform is one data file + test. Consumes plain shape snapshots `{ id, bounds, meta }` — it is DOM-free, canvas-free, and runs in bare Node.

**@open-draw/markdown** — the compiler. `compile(annotatedScene, options) → string`. Pure, stateless, deterministic. Its **output format is a frozen public interface**: golden fixtures pin it byte-for-byte; any byte change requires a major version bump. The emitted spec is what AI tools and third parties consume — treat it like a public standard.

**OpenDraw Studio (apps/studio)** — the React app: mounts the canvas, provides the inspector (segmented controls: Type picker, parent, platform, breakpoints), renders tags as canvas overlay children (glued by architecture, per §2), wires canvas snapshots → `semantics` → `markdown` → an output panel with preview/copy. Hosts persistence (versioned localStorage snapshots + migrations).

## 4. THE TESTS THAT MATTER MOST

1. **The overlay invariant (soul):** an overlay child appended to a shape's group must remain glued to that shape (±1px) through hard pans and zoom from 0.2× to 5×. This spec is written BEFORE the rendering code that satisfies it, and it gates the canvas package's entire existence.
2. **Golden fixtures (contract):** the markdown compiler's output for canonical scenes is pinned byte-identical. Two runs must produce identical bytes.
3. **Real-browser E2E for interactions:** unit tests with stubbed DOM prove nothing about pointer behavior. Draw/select/drag/resize flows are tested with real pointer events in Playwright (Chromium; firefox/webkit in the hardening phase).
4. **Boundary enforcement:** CI proves the import arrows of §1 — including a deliberate-violation test that shows the check turning red before it can be trusted green.
5. **Purity proofs:** `semantics` annotates a hand-written JSON scene with no canvas; `markdown` compiles in bare Node with zero DOM.

## 5. WORKING RULES (non-negotiable)

- **Zero runtime dependencies** in every package, forever. `dependencies: {}` is CI-checked. If you believe a dependency is needed, write `docs/od-questions.md` and stop that item.
- **No invention.** Anything unspecified → log it in `docs/od-questions.md`, mark the code with `// OD-QUESTION:`, continue elsewhere. Never silently invent a value, behavior, or API.
- **API facts are spiked, not assumed.** Unfamiliar pointer/observer/serialization behavior → 10-line spike, record findings in `docs/od-spike-notes.md`, delete the spike.
- **Small commits:** one unit each; `tsc` + tests green before every commit. TS strict; no `any`, no `@ts-ignore`; no file > 500 lines, no class > 300.
- **E2E gates every phase.** A phase exits only when: all tests green · E2E green · walkthrough screenshots in `docs/od-verification/<phase>/` · REPORT.md citing test paths for every claim (one uncited claim = redo) · CI green.
- **The maintainer's hand test is the final gate** of app-level milestones: they draw, tag, drag, zoom — unassisted — and the result must work.
- **Real-Input Rule (the "third-strike" rule, permanent):** Every user-facing interaction's happy path gets at least ONE E2E test using real Playwright input (`page.click`, `page.fill`, `page.selectOption`, `page.press`, `keyboard.*`) — **never** `page.evaluate`-dispatched synthetic events. Synthetic dispatch remains legitimate ONLY for engine-level unit checks (store ops, camera math) where no user path exists.
- **CI-Green-Before-Push Rule (permanent):** Before ANY push to any branch, the agent runs locally the FULL verification stack: `npm run verify` (all fences) + the complete Playwright matrix `--project=chromium --project=firefox --project=webkit` + typecheck + unit tests. A push that fails CI is a PROCESS FAILURE and must be recorded in the questions log.
- **Strict Edge-Case Enumeration:** For every feature, edge cases must be enumerated explicitly; each edge case gets its own assertion or test.
- **Question-first culture:** when blocked, ask. The questions doc is a feature, not a failure.

## 6. BUILD ORDER (strict — no phase overlap)

1. Monorepo skeleton + CI + import-boundary check (with deliberate-violation proof)
2. Canvas engine: store → camera → first shape → **overlay invariant green** → interactions → shape set → ink → SDK freeze (0.1.0) → hardening (0.2.0)
3. Semantics package
4. Markdown package (golden fixtures from day one)
5. Studio app (thin composition, golden-path E2E)
6. Release: READMEs, npm publish, suite integration matrix

## 7. IDENTITY

- Brand: **OpenDraw**. App: **OpenDraw Studio**. npm scope: `@open-draw/*` (public access via publishConfig).
- License: **MIT** (full text at repo root; packages inherit).
- The product thesis, in one sentence: *give AI the structure, not the pixels* — OpenDraw turns a drawing into a precise, stable, machine-readable spec.
