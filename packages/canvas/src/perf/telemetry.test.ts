import { describe, expect, it } from 'vitest';
import { FrameTelemetry } from './telemetry.js';

describe('FrameTelemetry', () => {
  it('initializes with default metrics', () => {
    const telemetry = new FrameTelemetry();
    const metrics = telemetry.getMetrics();
    expect(metrics.fps).toBe(60);
    expect(metrics.p50LatencyMs).toBe(0);
    expect(metrics.sampleCount).toBe(0);
    expect(metrics.droppedFrames).toBe(0);
  });

  it('records input-to-paint latency and calculates percentiles', () => {
    const telemetry = new FrameTelemetry(10);
    telemetry.enable();

    // 10 samples with latencies 1..10
    for (let i = 1; i <= 10; i++) {
      telemetry.recordInput(100 * i);
      telemetry.recordPaint(100 * i + i); // latency = i ms
    }

    const m = telemetry.getMetrics();
    expect(m.sampleCount).toBe(10);
    expect(m.p50LatencyMs).toBe(6);
    expect(m.p95LatencyMs).toBe(10);
    expect(m.p99LatencyMs).toBe(10);
    telemetry.disable();
  });

  it('tracks dropped frames when delta exceeds 25ms', () => {
    const telemetry = new FrameTelemetry();
    telemetry.enable();

    telemetry.recordPaint(100);
    telemetry.recordPaint(116); // delta 16ms -> ok
    telemetry.recordPaint(150); // delta 34ms -> dropped frame!
    telemetry.recordPaint(190); // delta 40ms -> dropped frame!

    const m = telemetry.getMetrics();
    expect(m.droppedFrames).toBe(2);
    telemetry.disable();
  });

  it('resets cleanly', () => {
    const telemetry = new FrameTelemetry();
    telemetry.enable();
    telemetry.recordInput(10);
    telemetry.recordPaint(25);
    expect(telemetry.getMetrics().sampleCount).toBe(1);

    telemetry.reset();
    expect(telemetry.getMetrics().sampleCount).toBe(0);
    telemetry.disable();
  });
});
