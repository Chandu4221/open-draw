# DOM Canvas Core — Benchmark Spike Report

- **Date:** 2026-10-20
- **Scope:** Phase 2 Step B6 Benchmark Spike
- **Status:** Complete (Empirical Observations Recorded — No Perf Budgets Claimed)

---

## 1. Test Hardware Specifications

All benchmark measurements were conducted on a defined local testing environment:
- **Operating System:** Linux 6.6 x86_64 (Ubuntu)
- **CPU:** Intel(R) Core(TM) i5-4300M CPU @ 2.60GHz (2 physical cores, 4 logical threads)
- **RAM:** 16 GB DDR3 (15 GiB available)
- **Browser:** Chromium (Playwright headless test harness)
- **Screen Resolution:** 1280 × 720 viewport

---

## 2. Methodology & Clocks

The benchmark harness is mechanized in [`packages/canvas/e2e/benchmarks.spec.ts`](packages/canvas/e2e/benchmarks.spec.ts).

### Measurement Clocks
1. **Time-To-First-Frame (TTFF):**
   - High-resolution `performance.now()` timestamp recorded immediately before `editor.loadSnapshot(snapshot)`.
   - Resolves after two consecutive `requestAnimationFrame` ticks, ensuring that the browser has received the DOM nodes, performed initial layout, and composited the frame.
2. **Main-Thread Drag Blocking Duration:**
   - Measures synchronous CPU execution time per drag event (`performance.now()` delta around `editor.updateShape` across 30 consecutive drag steps) while moving 1 shape among $N$ stationary shapes.
3. **Camera Pan Frame Duration:**
   - Measures time to update the root viewport transform and resolve `requestAnimationFrame` across 20 pan steps at three zoom levels ($0.2\times$, $1.0\times$, $5.0\times$).
4. **DOM Node Count:**
   - Total count of SVG elements under `.od-canvas-root` queried via `document.querySelectorAll('.od-canvas-root *').length`.

---

## 3. Results Table (Observations, Not Budgets)

> [!IMPORTANT]
> The numbers below are strictly **empirical observations** recorded on the hardware defined above. Per the OpenDraw working rules, **no performance budgets or latency claims are asserted or documented as guarantees**.

| Shape Count ($N$) | DOM Node Count | Time-To-First-Frame (TTFF) | Avg Drag Block (CPU) | Max Drag Block (CPU) | Pan Latency (0.2×) | Pan Latency (1.0×) | Pan Latency (5.0×) |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **100** | 302 nodes | 30.8 ms | 0.010 ms | 0.100 ms | 16.62 ms (60 fps) | 16.65 ms (60 fps) | 16.66 ms (60 fps) |
| **500** | 1,502 nodes | 29.8 ms | 0.003 ms | 0.100 ms | 16.67 ms (60 fps) | 16.68 ms (60 fps) | 16.66 ms (60 fps) |
| **1,000** | 3,002 nodes | 30.5 ms | 0.003 ms | 0.100 ms | 16.67 ms (60 fps) | 16.67 ms (60 fps) | 16.66 ms (60 fps) |

---

## 4. Key Architectural Observations

1. **Near-Zero Main-Thread Blocking on Drag (< 0.01 ms):**
   - Dragging a single shape among 1,000 shapes does not dirty the remaining 999 shapes.
   - Because of keyed node reuse and isolated shape wrapper transforms (`transform="translate(x, y)"`), the engine only updates the transform attribute of the active shape's wrapper group. Zero DOM allocations or shape rebuilds occur during drag.
2. **Transform Pan Latency at Display Refresh (~16.6 ms):**
   - Camera translation and zoom operate on a single root `<g class="od-viewport">`.
   - The browser compositing engine translates the entire scene graph on the GPU compositor at the display refresh cadence (60 Hz / ~16.6 ms) across all zoom levels ($0.2\times$ through $5.0\times$).
3. **Flat TTFF (~30 ms):**
   - Initial scene construction for 1,000 shapes (3,002 SVG elements) mounts in under 31 ms on modest dual-core hardware.
4. **Culling Assessment Basis:**
   - At 1,000 shapes (3,002 DOM elements), the DOM Canvas performs smoothly without any DOM node virtualization/culling.
   - Recorded follow-up question in `docs/od-questions.md` regarding the empirical threshold where viewport culling should be activated.
