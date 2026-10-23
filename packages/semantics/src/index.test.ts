import { describe, expect, it } from 'vitest';
import { getSemanticType, listSemanticTypes, validateSemanticMeta } from './index.js';

describe('semantics smoke test', () => {
  it('retrieves semantic types from vocabulary', () => {
    const card = getSemanticType('card');
    expect(card?.id).toBe('card');
    expect(card?.isContainer).toBe(true);

    const allTypes = listSemanticTypes();
    expect(allTypes.length).toBeGreaterThanOrEqual(8);
  });

  it('validates semantic metadata objects', () => {
    expect(validateSemanticMeta({ type: 'button', name: 'Submit' })).toBe(true);
    expect(validateSemanticMeta({ type: 123 })).toBe(false);
  });
});
