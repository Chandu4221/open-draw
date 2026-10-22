# Verification Report — Phase 2.s: SDK 0.1.0 Freeze & First Public Release

- **Target:** `@open-draw/schema@0.1.0` and `@open-draw/canvas@0.1.0`
- **Branch:** `build/sdk-0.1.0`
- **Date:** 2026-10-22
- **Status:** Complete & Verified Green

---

## 1. Public API Audit & Golden Fence (§1)

### Public Surface Enumeration
- `@open-draw/schema@0.1.0`: 13 runtime exports (all **Frozen**), including core types (`ShapeId`, `Point`, `Bounds`, `Camera`, `ShapeRecord`, `Snapshot`), error types (`InvalidBoundsError`, `CorruptSnapshotError`), and half-open geometric functions (`boundsOf`, `boundsUnion`, `boundsIntersect`, `boundsContain`, `pointInBounds`).
- `@open-draw/canvas@0.1.0`: 106 runtime exports, including `CanvasEditor`, `CanvasStore`, `CameraController`, `SVGRenderer`, `ShapeRegistry`, 9 shape definitions, selection/handles, capability managers, keyboard dispatcher, and `exportPNG`. Experimental APIs (`FrameTelemetry`, `TelemetryMetrics`, `GestureController`, `GestureType`) are explicitly documented in `docs/api-0.1.0.md`.

### Golden Snapshot & 9th CI Fence
- **Golden Snapshot:** Checked into `docs/api-0.1.0.snapshot.json`.
- **CI Fence:** Created `scripts/check-public-api.js` and wired into `npm run check:public-api`, `npm run verify`, and `.github/workflows/ci.yml`.
- **Red/Green Proof:**
  - **RED:** Injected uncommitted export `export const __UNCOMMITTED_LEAK_TEST__ = true;` into `packages/canvas/src/index.ts`. Rebuilt and executed `node scripts/check-public-api.js`. Failed with exit code 1 and message: `❌ PUBLIC API MISMATCH in @open-draw/canvas: - Uncommitted new exports (1): __UNCOMMITTED_LEAK_TEST__`.
  - **GREEN:** Reverted uncommitted export and rebuilt. `node scripts/check-public-api.js` passed with exit code 0 and message: `✅ Public API check passed: exports match docs/api-0.1.0.snapshot.json exactly.`

### Semver & Deprecation Discipline
- Recorded in `README.md` and `docs/api-0.1.0.md`: Starting from `0.1.0`, no public export will be removed or altered without an advance minor-version deprecation cycle.
- Dependencies: `scripts/check-dependencies.js` verified that `@open-draw/schema` has `dependencies: {}`, and `@open-draw/canvas` has exactly `dependencies: { "@open-draw/schema": "^0.1.0" }`.

---

## 2. Canvas exportPNG Implementation (§2)

### Architecture & Non-Destructive Chips Toggle
- Implemented `exportPNG(editor, options)` in `packages/canvas/src/export/png.ts` and exposed `editor.exportPNG(options?: ExportPngOptions): Promise<Blob>` on `CanvasEditor`.
- **Chips On/Off:** Overlays (`.od-overlay-slot`, `.od-selection-layer`) are visually hidden via `style.display = 'none'` before serialization and restored in a `finally` block, ensuring zero live DOM disruption and zero store mutations.
- **Camera Modes:** Supports `view` (current viewport camera), `content` (calculates tight bounding box around all shapes with 24px padding), or custom `Partial<Camera>`.

### Narrow Bitmap Fence Exemption (Q-006)
- The live canvas render path remains 100% SVG/DOM.
- An audited exemption was documented on `packages/canvas/src/export/png.ts:131` (`// EXEMPTION: serialization-only path for exportPNG per Phase 2.s §2`), documented in the header of `scripts/check-no-bitmap.js`, and recorded as `Q-006` in `docs/od-questions.md`.

### E2E Test Suite (`packages/canvas/e2e/export.spec.ts`)
- `export 3-shape scene, decode PNG header, assert dimensions, non-empty, and store untouched`: Validated PNG magic signature (`\x89PNG\r\n\x1a\n`), IHDR chunk dimensions, byte-for-byte snapshot roundtrip equality, and overlay slot structural invariant.
- `chips-on vs chips-off produce different bytes and overlay restored intact`: Validated distinct binary outputs when chip is toggled and verified chip visibility restoration in DOM.
- `camera mode content exports tight bounding box around shapes`: Validated auto-fitting of content bounds (148x148 px).
- Result: **3/3 passed (3.5s)**.

---

## 3. Documentation — 90-Second Test (§3)

- **Root `README.md`:** Rewritten to deliver complete comprehension in 90 seconds. Contains:
  - Exact one-liner: "an infinite DOM canvas where every shape is a real SVG element — draw, tag, compile to a spec your AI can build from".
  - 3-bullet What/Why (Real SVG Elements, Pure Architecture, AI-Native).
  - Quickstart snippet with `CanvasEditor` mounting, shape creation, overlay chip attachment, and undo/redo.
  - Architecture diagram displaying strict one-way dependency layers.
  - Guardrail culture statement ("every guardrail is proven broken before it's trusted — red/green proofs in CI").
  - MIT and npm 0.1.0 badges.
- **Package READMEs:**
  - `packages/canvas/README.md`: 30-line runnable snippet covering init, shape, overlay slot, undo, and `exportPNG`. Includes local playground launch command (`npx vite --config packages/canvas/e2e/playground/vite.config.ts packages/canvas/e2e/playground --host 127.0.0.1 --port 5173`).
  - `packages/schema/README.md`: 10-line geometry evaluation snippet.
- **Changelogs:** Authored `packages/canvas/CHANGELOG.md` and `packages/schema/CHANGELOG.md` for `0.1.0`.
- **Demo GIF Marker:** Added placeholder `docs/demo.gif`.

---

## 4. Publish Machinery & Tarball Manifest (§4 & §5)

### Package Release Configuration
- `packages/schema/package.json`: `version: "0.1.0"`, `main: "./dist/index.js"`, `types: "./dist/index.d.ts"`, `files: ["dist", "!dist/**/*.test.*", "README.md", "LICENSE"]`, `publishConfig: { "access": "public" }`.
- `packages/canvas/package.json`: `version: "0.1.0"`, `main: "./dist/index.js"`, `types: "./dist/index.d.ts"`, `dependencies: { "@open-draw/schema": "^0.1.0" }`, `files: ["dist", "!dist/**/*.test.*", "README.md", "LICENSE"]`, `publishConfig: { "access": "public" }`.
- `packages/semantics`, `packages/markdown`, and `apps/studio` marked `"private": true` with publishConfig omitted.

### Dry-Run Tarball Inspection (`npm publish --dry-run --workspaces`)
- `@open-draw/schema@0.1.0`:
  - Tarball: `open-draw-schema-0.1.0.tgz`
  - Package size: **5.3 kB** (unpacked: 19.9 kB)
  - Total files: 19
  - Test files included: **0**
- `@open-draw/canvas@0.1.0`:
  - Tarball: `open-draw-canvas-0.1.0.tgz`
  - Package size: **89.1 kB** (unpacked: 499.8 kB)
  - Total files: 343
  - Test files included: **0**
- Workspaces `@open-draw/semantics`, `@open-draw/markdown`, and `@open-draw/studio` skipped automatically as private.

### GitHub Actions Publish Workflow
- Created `.github/workflows/publish.yml` triggered exclusively via `workflow_dispatch`.
- Builds packages, runs `npm run verify` across all 9 fences, performs dry-run checks, and publishes `@open-draw/schema` followed by `@open-draw/canvas` using maintainer-held `secrets.NPM_TOKEN`.

---

## 5. Verification Suite & Gates Summary

### Guardrail Verification (`npm run verify`)
1. `check:boundaries`: All one-way dependency rules satisfied.
2. `check:deps`: Zero forbidden runtime dependencies.
3. `check:bitmap`: Zero illegal occurrences of `getContext` in render paths.
4. `check:zoom`: Zero zoom math occurrences outside `camera.ts`.
5. `check:shapes`: Zero hardcoded shape-type branching outside shape plugins.
6. `check:filesize`: All source files within 300 lines limit.
7. `check:links`: Zero non-portable absolute file-URI links in docs.
8. `check:public-api`: Public API exports match `docs/api-0.1.0.snapshot.json` exactly.
- **Unit Test Suites:** 31 passed (162 tests passed).

### E2E Test Suite (`playwright test`)
- 17 test spec files passed (48 tests passed).

### Interaction Performance Fence (`npm run check:perf`)
- Drag 100 shapes: 60 FPS, p50 9.6ms, p95 12.1ms, 0 dropped frames.
- Resize 100 shapes: 60 FPS, p50 11.3ms, p95 12.8ms, 0 dropped frames.
- Rotate 100 shapes: 60 FPS, p50 5.5ms, p95 15.1ms, 0 dropped frames.
- Pan 100 shapes: 60 FPS, p50 5.5ms, p95 14.2ms, 0 dropped frames.

---

## 6. Post-Publish Verification Plan (Maintainer Gate 2 Execution)

Once published to npm by the maintainer, the following clean-room verification script must be executed in a temporary directory outside the repo:

```bash
mkdir -p /tmp/opendraw-verify && cd /tmp/opendraw-verify
npm init -y
npm install @open-draw/canvas@0.1.0 @open-draw/schema@0.1.0

node -e "
Promise.all([
  import('@open-draw/schema'),
  import('@open-draw/canvas')
]).then(([schema, canvas]) => {
  console.log('Installed @open-draw/schema exports:', Object.keys(schema).length);
  console.log('Installed @open-draw/canvas exports:', Object.keys(canvas).length);
  if (Object.keys(schema).length !== 13 || Object.keys(canvas).length !== 106) {
    console.error('FAIL: export count mismatch!');
    process.exit(1);
  }
  console.log('SUCCESS: All exports verified against 0.1.0 contract.');
});
"
```
