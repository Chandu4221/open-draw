# OpenDraw — Spike Notes (`docs/od-spike-notes.md`)

This document records empirical findings from spikes exploring browser APIs, pointer behaviors, observer edge-cases, or serialization characteristics.
Per OpenDraw working rules: **API facts are spiked, not assumed**. Unfamiliar behavior $\to$ 10-line spike, findings recorded here, spike deleted.

| Spike ID | Date | Target API / Area | Hypothesis & Test | Finding & Conclusion |
|---|---|---|---|---|
| `SPK-001` | 2026-10-20 | DOM Canvas Performance (100–1000 Shapes) | Measured TTFF, per-frame drag block, and pan across 100/500/1000 shapes in Chromium harness (`packages/canvas/e2e/benchmarks.spec.ts`). | TTFF ~30ms, per-frame drag block <0.01ms, pan ~16.6ms at 60fps across all zoom levels (0.2x–5x). DOM retained mode scales without virtualization up to 1,000 shapes. Documented in `docs/od-verification/2/benchmarks.md`. |
| `SPK-002` | 2026-10-20 | DOM Canvas Culling Stress Spike (2,000–10,000 Shapes) | Measured TTFF, per-frame drag blocking, and pan fps at 1× for 2k, 5k, 10k simple shapes in Chromium harness (`packages/canvas/e2e/benchmarks.spec.ts`). | 2,000 shapes (6,002 nodes): TTFF 59.1ms, drag block 0.01ms, 60fps pan. 5,000 shapes (15,002 nodes): TTFF 131.9ms, drag block <0.01ms, 60fps pan. 10,000 shapes (30,002 nodes): TTFF 295.2ms, drag block <0.01ms, 52fps pan. Retention scales well for simple rects; culling trigger is node-per-shape ratio of complex shapes, not raw simple shape count. Documented in `docs/od-verification/2x/culling-stress-results.json`. |
