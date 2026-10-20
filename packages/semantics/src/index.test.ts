import { describe, expect, it } from 'vitest';
import { createSemanticTag } from './index.js';

describe('semantics smoke test', () => {
  it('creates semantic tag', () => {
    const tag = createSemanticTag('card', 'container');
    expect(tag.type).toBe('card');
    expect(tag.role).toBe('container');
  });
});
