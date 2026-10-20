import { describe, expect, it } from 'vitest';
import { compile } from './index.js';

describe('markdown smoke test', () => {
  it('compiles stub scene into spec header', () => {
    const output = compile({});
    expect(output).toContain('<!-- open-draw-spec:v1 -->');
  });
});
