import { describe, expect, it } from 'vitest';
import { DOMCanvasEngine } from './index.js';

describe('canvas smoke test', () => {
  it('instantiates DOMCanvasEngine', () => {
    const engine = new DOMCanvasEngine();
    expect(engine.isReady()).toBe(true);
  });
});
