import type { ShapeId } from './types.js';

/**
 * 29-character alphabet for shape IDs:
 * - Digits: 2–9 (excludes 0, 1 to prevent confusion with o, l)
 * - Lowercase consonants: b-z excluding vowels a, e, i, o, u (prevents accidental words)
 */
export const SHAPE_ID_ALPHABET = '23456789bcdfghjklmnpqrstvwxyz';

const DENSITY_THRESHOLD = 10_000;
const BASE_LENGTH = 4;
const EXPANDED_LENGTH = 5;

/**
 * Simple deterministic Mulberry32 PRNG for seeded test execution.
 */
function createMulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a short, collision-resistant shape ID per ADR-006.
 * - Random 4-char string from 29-char alphabet (~707k space).
 * - Grows to 5-char string when document exceeds density threshold (10k shapes).
 * - Regenerates if collision exists in existingIds.
 * - Deterministic if optional seed is provided.
 */
export function generateShapeId(
  existingIds?: Iterable<ShapeId>,
  seed?: number | string
): ShapeId {
  let count = 0;
  let existingSet: { has(id: ShapeId): boolean } | null = null;

  if (existingIds) {
    if (typeof (existingIds as any).has === 'function' && typeof (existingIds as any).size === 'number') {
      existingSet = existingIds as any;
      count = (existingIds as any).size;
    } else {
      const s = new Set(existingIds);
      existingSet = s;
      count = s.size;
    }
  }

  const length = count >= DENSITY_THRESHOLD ? EXPANDED_LENGTH : BASE_LENGTH;

  let random: () => number;
  if (typeof seed === 'number') {
    random = createMulberry32(seed);
  } else if (typeof seed === 'string') {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
    }
    random = createMulberry32(hash);
  } else {
    random = Math.random;
  }

  const alphaLen = SHAPE_ID_ALPHABET.length;
  const maxAttempts = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let id = '';
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(random() * alphaLen);
      id += SHAPE_ID_ALPHABET[idx];
    }
    if (!existingSet || !existingSet.has(id)) {
      return id;
    }
  }

  // Fallback in astronomical density: expand length by 1
  let fallbackId = '';
  for (let i = 0; i < length + 1; i++) {
    const idx = Math.floor(random() * alphaLen);
    fallbackId += SHAPE_ID_ALPHABET[idx];
  }
  return fallbackId;
}

/**
 * Validates whether a string is a valid shape ID per ADR-006.
 */
export function isValidShapeId(id: string): boolean {
  if (typeof id !== 'string' || id.length < 4 || id.length > 12) {
    return false;
  }
  for (let i = 0; i < id.length; i++) {
    if (!SHAPE_ID_ALPHABET.includes(id[i]!)) {
      return false;
    }
  }
  return true;
}

/**
 * Validates a human-assigned shape name per ADR-006.
 * - Optional label capped at 64 characters
 * - No ASCII control characters (0x00–0x1F, 0x7F)
 */
export function isValidShapeName(name: string): boolean {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length > 64) return false;
  // Reject ASCII control characters
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1F\x7F]/.test(name)) return false;
  return true;
}
