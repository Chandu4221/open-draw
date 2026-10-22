# Verification Report — Phase 0.2.0: Hardening (Cross-Browser, Accessibility, Leak Tests)

- **Target:** `@open-draw/canvas@0.2.0` (with `@open-draw/schema@0.1.0` unchanged)
- **Branch:** `build/0.2.0`
- **Date:** 2026-10-22
- **Status:** Complete & Verified Green (All 9 CI fences green, zero API drift)

---

## 1. Executive Summary & Goals

Phase 0.2.0 hardens the OpenDraw SDK to make it truly trustworthy across real browsers, accessible to assistive technologies and keyboard users, and free of memory and listener leaks:
1. **§1 Cross-Browser E2E Matrix:** Configured Playwright matrix for `chromium`, `firefox`, and `webkit`. Triaged and fixed engine discrepancies in standard-compliant, engine-neutral code without `navigator.userAgent` branching.
2. **§2 Accessibility (a11y) Audit:** Integrated `@axe-core/playwright` across 6 key canvas states. Assigned semantic ARIA roles (`role="group"` on containers to eliminate `nested-interactive`), WCAG 2.5.3 compliant accessible naming, and `:focus-visible` styling.
3. **§3 Memory & Listener Leaks:** Implemented 50-cycle lifecycle leak tests, in-flight gesture teardown tests, 100-cycle `exportPNG` overlay restoration tests, and complete listener attachment/removal symmetry verified with a reproducible Red/Green proof.
4. **§4 Release Readiness:** Bumped `@open-draw/canvas` to `0.2.0` (`@open-draw/schema` remains `0.1.0` as its code is untouched). Public API surface remains 100% frozen.

---

## 2. Defects Found vs. Defects Fixed

| ID | Area / Engine | Defect Discovered | Root Cause | Standards-Compliant Resolution |
|---|---|---|---|---|
| `DEF-001` | E2E / Firefox | `frame.spec.ts` bounding box mismatch on empty overlay slot | In Gecko/Firefox, `getBoundingClientRect()` on an empty `<g class="od-overlay-slot">` returns the SVG viewport origin `(0, 0)` rather than the local CTM origin. | Mounted a test element into the child slot before measuring CTM tracking. Recorded in `docs/od-spike-notes.md` (`SPK-004`). |
| `DEF-002` | E2E / Firefox | `handles.spec.ts` handle sizing and position subpixel delta | Firefox includes SVG stroke width in element bounding box (8px fill + 1.5px stroke = 9.5px), whereas Chromium measures fill only (8px). | Standardized handles with `vector-effect="non-scaling-stroke"` so screen stroke thickness remains invariant across all zoom levels; calibrated test assertion tolerance (`Math.abs <= 1.0`). |
| `DEF-003` | a11y / axe-core | `nested-interactive` violation on container frames with children | Frame wrappers were hardcoded with `role="button"` and `tabindex="0"`. When child shapes inside also have `role="button"`, ARIA forbids interactive controls nested inside interactive controls. | Container shapes (`frame`, `group`) with clipping/group capability receive semantic `role="group"`, while atomic interactive shapes receive `role="button"`. |
| `DEF-004` | a11y / axe-core | `nested-interactive` violation during inline text editing | While editing, the text shape wrapper (`role="button"`) contained the `<textarea>` form control. | During editing mode, `startEditing()` temporarily demotes the wrapper to `role="group"` and `tabindex="-1"`, restoring `role="button"` and `tabindex="0"` on `commit()` or `cancel()`. |
| `DEF-005` | a11y / axe-core | `label-content-name-mismatch` on text/label shapes | Axe-core flagged text shapes whose visible text (`Sample Text`) was omitted from the accessible name (`aria-label="text Item 20"`), violating WCAG 2.5.3. | Implemented `computeShapeAria`: visible text (`props.text` or `props.label`) is incorporated into the accessible name (e.g. `Sample Text (text Item 20)`). |
| `DEF-006` | a11y / axe-core | Missing form control label on inline text editor `<textarea>` | The dynamically injected `<textarea>` lacked an accessible label, triggering axe-core form label violation. | Added explicit `aria-label="Edit shape text"` to the `<textarea>` on creation. |
| `DEF-007` | Leaks / Lifecycle | Incomplete teardown if editor destroyed mid-text-edit | If `editor.destroy()` was called while inline text editing was active, the `<textarea>` event listeners and DOM elements were not cleaned up. | Added `this.textEditing.cancel()` to `CanvasEditor.destroy()`. |
| `DEF-008` | E2E / WebKit | `live-preview.spec.ts` midpoint assertions sampled before queued RAF fired | In WebKitGTK/Linux WebKit, `pointermove` events enqueue a `requestAnimationFrame` callback, but `page.evaluate()` runs on the next microtask before the frame tick occurs. | Added `flushRAF()` helper (two nested `requestAnimationFrame` calls) after midpoint pointer moves to let the browser frame queue drain before evaluating live DOM transforms. Recorded in `docs/od-spike-notes.md` (`SPK-004`). |

---

## 3. Cross-Browser E2E Matrix (§1)

### Matrix Configuration
- Updated `playwright.config.ts` projects to:
  - `chromium` (Desktop Chrome)
  - `firefox` (Desktop Firefox)
  - `webkit` (Desktop Safari)
- Updated `.github/workflows/ci.yml` with `npx playwright install --with-deps` and cross-browser execution in the E2E matrix job.

### Engine Observations (`SPK-004`)
1. **Gecko/Firefox Empty `<g>` Bounding Box:** Empty groups evaluate to viewport origin `(0, 0)`. Populated groups evaluate to local transform.
2. **Gecko/Firefox Stroke-Box vs Fill-Box:** Firefox includes stroke width in `getBoundingClientRect()` for SVG elements. `vector-effect="non-scaling-stroke"` ensures consistent 1.5px visual thickness across all engines.
3. **PNG Serialization:** `editor.exportPNG` produces valid PNG headers (`\x89PNG\r\n\x1a\n`) across all engines.
4. **Compositor Timing Skip:** `packages/canvas/e2e/perf-baseline.spec.ts` relies on Chromium's internal compositor scheduling telemetry at 60Hz. It is conditionally skipped on non-Chromium engines with explicit visible annotation: `test.skip(!isChromium, 'Compositor timing telemetry calibrated for Chromium 60Hz compositor')`.
5. **WebKit Environment Note:** WebKit running on headless Linux requires OS media libraries (`libgstcodecparsers`, `libharfbuzz-icu`, `libmanette`, `libenchant`, `libhyphen`). In CI, `npx playwright install --with-deps` provisions these automatically.
6. **WebKit RAF Throttling:** In WebKitGTK / headless Linux WebKit, pointer events schedule interaction updates via `requestAnimationFrame` throttled to the display refresh rate. E2E midpoint sampling after `page.mouse.move()` flushes the frame queue with standard `flushRAF()` to ensure pending DOM transforms are applied before assertion evaluation.

---

## 4. Accessibility Audit (§2)

### Axe-Core Automated Audit Suite (`packages/canvas/e2e/a11y.spec.ts`)
Axe-core scanned the live canvas container across 6 distinct states:
1. **State 1: Empty Canvas:** 0 critical, 0 serious violations.
2. **State 2: 20 Diverse Shapes:** All 8 built-in shape types; 0 critical, 0 serious violations.
3. **State 3: Active Selection:** 8 handles + rotate handle visible; 0 critical, 0 serious violations.
4. **State 4: Mid-Gesture In-Flight:** Live drag gesture paused mid-motion; 0 critical, 0 serious violations.
5. **State 5: Inline Text Editing:** Active `<textarea>` inside foreignObject; 0 critical, 0 serious violations.
6. **State 6: Frame Hierarchy:** Container frame with nested child shapes; 0 critical, 0 serious violations.

### Semantic Roles & Visible Focus
- Container shapes: `role="group"`.
- Atomic shapes: `role="button"`.
- Visible focus indicator: `.od-shape:focus-visible` and `.od-canvas-root:focus-visible` styled with `outline: 2px solid #3b82f6; outline-offset: 2px;`.
- Keyboard navigation: Full golden path verified with zero mouse events across Chromium and Firefox.

### Honest Scope Limitation
Programmatic screen-reader verification (e.g. testing with NVDA, JAWS, or VoiceOver synthesizers) is explicitly out of scope for Phase 0.2.0. Axe-core combined with keyboard-only navigation proves that semantic roles, accessible names, focusability, and DOM order are valid and operable. Screen-reader user testing is designated as a 0.3.x candidate.

---

## 5. Memory & Listener Leak Suite (§3)

### E2E Leak Suite (`packages/canvas/e2e/leaks.spec.ts`)
1. **50-Cycle Editor Lifecycle Test:** Created editor $\to$ drew 50 shapes $\to$ destroyed editor $\to$ repeated 50 times.
   - Result: Container child elements = 0 at every cycle exit. DOM node count plateaued: `|cycle50Nodes - cycle10Nodes| <= 2`.
2. **Listener Audit:** Tracked all `addEventListener` and `removeEventListener` calls on `host` and `window`.
   - Result: 0 dangling listeners after `destroy()`.
   - Zero callbacks or store mutations when user events (`dblclick`, `pointerdown`, `pointermove`, `pointerup`, `keydown`, `dragover`, `drop`) were dispatched on orphaned DOM.
3. **Gesture-Path In-Flight Teardown:** Repeated 20 cycles of `pointerdown` $\to$ `pointermove` $\to$ mid-gesture `editor.destroy()` $\to$ `pointerup`.
   - Result: Zero unhandled exceptions, zero orphaned RAF loops, zero store transactions.
4. **exportPNG 100-Cycle Stability:** Executed 100 consecutive exports with alternating chips visibility.
   - Result: Initial DOM count (225) === Final DOM count (225). Initial overlay count === Final overlay count. Zero DOM leaks.

### Red/Green Leak Proof
- **RED Proof:** Deliberately commented out `this.container.removeEventListener('dblclick', this.onDblClick)` in `packages/canvas/src/editor.ts:124`. Executed `npx playwright test packages/canvas/e2e/leaks.spec.ts:85`.
  - Failure: `Error: Dangling listeners after destroy: [{"target":"host","type":"dblclick"}]`.
- **GREEN Proof:** Restored `this.container.removeEventListener('dblclick', this.onDblClick)`. Rebuilt and re-ran.
  - Result: Passed in 376ms.

---

## 6. Public API Surface & Guardrail Verification

### Golden Snapshot Check
- Ran `node scripts/check-public-api.js`:
  - `✅ Public API check passed: exports match docs/api-0.1.0.snapshot.json exactly.`
  - Zero public exports added, modified, or removed.

### All 9 CI Fences Green
1. `npm run build`: Clean TypeScript compile across all packages.
2. `npm run typecheck`: Zero TypeScript errors.
3. `npm test`: 32 test files, 168 unit tests passing.
4. `check:boundaries`: Strict one-way import rules satisfied.
5. `check:deps`: Zero runtime dependencies (`dependencies: {}` in schema, canvas depends only on schema).
6. `check:bitmap`: Zero occurrences of `getContext` in `packages/canvas/src` (outside audited export exemption).
7. `check:zoom`: Zero zoom math outside `camera.ts`.
8. `check:shapes`: Zero hardcoded shape-type branching outside shape modules.
9. `check:filesize`: All source files strictly under 300 lines limit.

---

## 7. Release 0.2.0 Checklist & Maintainer Gate

- [x] `@open-draw/canvas` bumped to `0.2.0` in `packages/canvas/package.json`.
- [x] `@open-draw/schema` remains `0.1.0` (unchanged).
- [x] `packages/canvas/CHANGELOG.md` updated with 0.2.0 hardening notes.
- [x] `publint packages/canvas` reports "All good!".
- [x] Dry-run tarball packed and inspected: `open-draw-canvas-0.2.0.tgz` (88.7 kB).
- [ ] Maintainer Gate: Push `build/0.2.0` to GitHub.
- [ ] Maintainer Gate: Trigger Release Workflow (`Release to npm` via GitHub Actions).
- [ ] Clean-room fresh install verification.
