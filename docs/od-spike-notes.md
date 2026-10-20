# OpenDraw — Spike Notes (`docs/od-spike-notes.md`)

This document records empirical findings from spikes exploring browser APIs, pointer behaviors, observer edge-cases, or serialization characteristics.
Per OpenDraw working rules: **API facts are spiked, not assumed**. Unfamiliar behavior $\to$ 10-line spike, findings recorded here, spike deleted.

| Spike ID | Date | Target API / Area | Hypothesis & Test | Finding & Conclusion |
|---|---|---|---|---|
| `SPK-001` | 2026-10-20 | DOM Canvas Performance (100–1000 Shapes) | Measured TTFF, per-frame drag block, and pan across 100/500/1000 shapes in Chromium harness (`packages/canvas/e2e/benchmarks.spec.ts`). | TTFF ~30ms, per-frame drag block <0.01ms, pan ~16.6ms at 60fps across all zoom levels (0.2x–5x). DOM retained mode scales without virtualization up to 1,000 shapes. Documented in `docs/od-verification/2/benchmarks.md`. |
