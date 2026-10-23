import { describe, it, expect } from 'vitest';
import {
  generateShapeId,
  isValidShapeId,
  isValidShapeName,
  SHAPE_ID_ALPHABET,
} from './id.js';

describe('ADR-006 Shape ID Generator & Validator', () => {
  it('generates 4-character ID from the 29-char alphabet by default', () => {
    const id = generateShapeId();
    expect(id).toHaveLength(4);
    expect(isValidShapeId(id)).toBe(true);
  });

  it('strictly excludes 0, 1, and vowels (a, e, i, o, u)', () => {
    const excluded = ['0', '1', 'a', 'e', 'i', 'o', 'u'];
    for (const char of excluded) {
      expect(SHAPE_ID_ALPHABET.includes(char)).toBe(false);
    }
    expect(SHAPE_ID_ALPHABET).toHaveLength(29);

    // Verify 1000 generated IDs
    for (let i = 0; i < 1000; i++) {
      const id = generateShapeId();
      for (const char of excluded) {
        expect(id).not.toContain(char);
      }
    }
  });

  it('produces deterministic output when seeded', () => {
    const id1 = generateShapeId(undefined, 12345);
    const id2 = generateShapeId(undefined, 12345);
    const id3 = generateShapeId(undefined, 67890);

    expect(id1).toBe(id2);
    expect(id1).not.toBe(id3);
  });

  it('regenerates on collision with existing IDs', () => {
    const existing = new Set(['k7w2', '8pqz']);
    // Seed that might hit an existing id
    const id = generateShapeId(existing, 42);
    expect(existing.has(id)).toBe(false);
  });

  it('expands length to 5 characters when document exceeds density threshold (10,000 shapes)', () => {
    // Mock a large set
    const largeSet = {
      size: 10_000,
      has: (_val: string) => false,
      [Symbol.iterator]: function* () {},
    };
    const id = generateShapeId(largeSet as any);
    expect(id).toHaveLength(5);
    expect(isValidShapeId(id)).toBe(true);
  });

  it('validates shape IDs correctly', () => {
    expect(isValidShapeId('k7w2')).toBe(true);
    expect(isValidShapeId('2345')).toBe(true);
    expect(isValidShapeId('k7w29')).toBe(true);
    // Invalid characters (0, 1, vowels, uppercase, symbols)
    expect(isValidShapeId('0123')).toBe(false);
    expect(isValidShapeId('kate')).toBe(false);
    expect(isValidShapeId('K7W2')).toBe(false);
    expect(isValidShapeId('k-w2')).toBe(false);
    expect(isValidShapeId('k7w')).toBe(false); // too short (<4)
  });

  it('validates shape names per ADR-006', () => {
    expect(isValidShapeName('Primary CTA')).toBe(true);
    expect(isValidShapeName('Hero Section')).toBe(true);
    expect(isValidShapeName('')).toBe(true);
    expect(isValidShapeName('A'.repeat(64))).toBe(true);
    expect(isValidShapeName('A'.repeat(65))).toBe(false); // exceeds 64 chars
    expect(isValidShapeName('Bad\x00Name')).toBe(false); // control char
    expect(isValidShapeName('Bad\x1FName')).toBe(false); // control char
  });
});
