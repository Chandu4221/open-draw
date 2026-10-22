/**
 * Performance and Frame-rate Telemetry (§1)
 * Measures input -> paint latency and frame rate over a sliding window.
 */

export interface TelemetryMetrics {
  readonly fps: number;
  readonly p50LatencyMs: number;
  readonly p95LatencyMs: number;
  readonly p99LatencyMs: number;
  readonly droppedFrames: number;
  readonly sampleCount: number;
}

export class FrameTelemetry {
  private windowSize: number;
  private latencies: number[] = [];
  private frameTimestamps: number[] = [];
  private droppedFrames = 0;
  private lastInputTime: number | null = null;
  private rafId: number | null = null;
  private overlayEl: HTMLElement | null = null;
  private isEnabled = false;

  constructor(windowSize = 60) {
    this.windowSize = windowSize;
  }

  enable(container?: HTMLElement): void {
    if (this.isEnabled) return;
    this.isEnabled = true;
    this.reset();
    if (container && typeof document !== 'undefined') {
      this._createOverlay(container);
    }
    this._startLoop();
  }

  disable(): void {
    this.isEnabled = false;
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
    }
  }

  reset(): void {
    this.latencies = [];
    this.frameTimestamps = [];
    this.droppedFrames = 0;
    this.lastInputTime = null;
  }

  recordInput(time: number = performance.now()): void {
    if (!this.isEnabled) return;
    this.lastInputTime = time;
  }

  recordPaint(time: number = performance.now()): void {
    if (!this.isEnabled) return;
    if (this.lastInputTime !== null) {
      const latency = Math.max(0, time - this.lastInputTime);
      this.latencies.push(latency);
      if (this.latencies.length > this.windowSize) {
        this.latencies.shift();
      }
      this.lastInputTime = null;
    }

    if (this.frameTimestamps.length > 0) {
      const prev = this.frameTimestamps[this.frameTimestamps.length - 1]!;
      const delta = time - prev;
      if (delta > 25) {
        // Dropped frame threshold: > 25ms (at 60Hz 16.6ms + jitter margin)
        this.droppedFrames++;
      }
    }
    this.frameTimestamps.push(time);
    if (this.frameTimestamps.length > this.windowSize) {
      this.frameTimestamps.shift();
    }

    this._updateOverlay();
  }

  getMetrics(): TelemetryMetrics {
    const count = this.latencies.length;
    if (count === 0 && this.frameTimestamps.length < 2) {
      return {
        fps: 60,
        p50LatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
        droppedFrames: this.droppedFrames,
        sampleCount: 0,
      };
    }

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? (sorted[sorted.length - 1] ?? 0);
    const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? (sorted[sorted.length - 1] ?? 0);

    let fps = 60;
    if (this.frameTimestamps.length >= 2) {
      const duration = this.frameTimestamps[this.frameTimestamps.length - 1]! - this.frameTimestamps[0]!;
      if (duration > 0) {
        fps = Math.round(((this.frameTimestamps.length - 1) * 1000) / duration);
      }
    }

    return {
      fps,
      p50LatencyMs: Math.round(p50 * 100) / 100,
      p95LatencyMs: Math.round(p95 * 100) / 100,
      p99LatencyMs: Math.round(p99 * 100) / 100,
      droppedFrames: this.droppedFrames,
      sampleCount: count,
    };
  }

  private _startLoop(): void {
    if (typeof requestAnimationFrame === 'undefined') return;
    const loop = (now: number) => {
      if (!this.isEnabled) return;
      this.recordPaint(now);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private _createOverlay(container: HTMLElement): void {
    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'od-perf-overlay';
    Object.assign(this.overlayEl.style, {
      position: 'absolute',
      top: '8px',
      right: '8px',
      padding: '6px 10px',
      background: 'rgba(15, 23, 42, 0.85)',
      color: '#f8fafc',
      fontFamily: 'monospace',
      fontSize: '11px',
      lineHeight: '1.4',
      borderRadius: '4px',
      zIndex: '99999',
      pointerEvents: 'none',
      userSelect: 'none',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    });
    container.appendChild(this.overlayEl);
  }

  private _updateOverlay(): void {
    if (!this.overlayEl) return;
    const m = this.getMetrics();
    this.overlayEl.textContent = `FPS: ${m.fps} | Latency p50: ${m.p50LatencyMs}ms p95: ${m.p95LatencyMs}ms | Drop: ${m.droppedFrames}`;
  }
}
