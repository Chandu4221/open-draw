import { describe, expect, it } from 'vitest';
import { createStudioConfig } from './index.js';

describe('studio smoke test', () => {
  it('creates studio app config', () => {
    const config = createStudioConfig();
    expect(config.title).toBe('OpenDraw Studio');
  });
});
