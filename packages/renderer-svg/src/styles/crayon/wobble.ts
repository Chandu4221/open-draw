// Pure deterministic seeded wobble generator (ADR-0005 D3, R-021).
// Zero runtime dependencies (R-002).
// Pure mathematical functions over plain numbers, zero Math.random() (R-008, R-041).

/**
 * 32-bit FNV-1a hash of a string to generate a stable, deterministic seed from a ShapeId.
 */
export function hashShapeId(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Deterministic pseudo-random float in [0, 1) derived from seed and step index.
 * SplitMix32 algorithm.
 */
export function seededRandom(seed: number, index: number): number {
  let t = (seed + Math.imul(index + 1, 0x6d2b79f5)) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Perturbation offset in [-amplitude, amplitude].
 */
export function wobbleOffset(seed: number, index: number, amplitude: number): number {
  const r = seededRandom(seed, index);
  return (r * 2 - 1) * amplitude;
}

/**
 * Generates an SVG path string for a hand-drawn / crayon line between two points.
 */
export function wobbleLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: number,
  offsetIndex: number = 0,
  amplitude: number = 2.0,
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) {
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }

  // Normal vector perpendicular to the line
  const nx = -dy / len;
  const ny = dx / len;

  const w1 = wobbleOffset(seed, offsetIndex, amplitude);
  const w2 = wobbleOffset(seed, offsetIndex + 1, amplitude);
  const mid1X = x1 + dx * 0.33 + nx * w1;
  const mid1Y = y1 + dy * 0.33 + ny * w1;
  const mid2X = x1 + dx * 0.66 + nx * w2;
  const mid2Y = y1 + dy * 0.66 + ny * w2;
  const endW = wobbleOffset(seed, offsetIndex + 2, amplitude * 0.4);
  const endX = x2 + nx * endW;
  const endY = y2 + ny * endW;

  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${mid1X.toFixed(1)} ${mid1Y.toFixed(1)}, ${mid2X.toFixed(1)} ${mid2Y.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
}

/**
 * Generates an SVG path string for a hand-drawn / crayon rectangle with 4 wobbled sides.
 */
export function wobbleRect(
  x: number,
  y: number,
  width: number,
  height: number,
  seed: number,
  amplitude: number = 2.0,
): string {
  const top = wobbleLine(x, y, x + width, y, seed, 0, amplitude);
  const right = wobbleLine(x + width, y, x + width, y + height, seed, 4, amplitude);
  const bottom = wobbleLine(x + width, y + height, x, y + height, seed, 8, amplitude);
  const left = wobbleLine(x, y + height, x, y, seed, 12, amplitude);

  return `${top} ${right} ${bottom} ${left} Z`;
}

/**
 * Generates an SVG path string for a hand-drawn / crayon ellipse.
 */
export function wobbleEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number,
  amplitude: number = 2.0,
): string {
  const points: Array<[number, number]> = [];
  const steps = 12;

  for (let i = 0; i <= steps; i++) {
    const angle = (i % steps) * ((Math.PI * 2) / steps);
    const w = wobbleOffset(seed, i * 2, amplitude);
    const rX = Math.max(1, rx + w);
    const rY = Math.max(1, ry + w);
    const px = cx + Math.cos(angle) * rX;
    const py = cy + Math.sin(angle) * rY;
    points.push([px, py]);
  }

  const first = points[0]!;
  let d = `M ${first[0].toFixed(1)} ${first[1].toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const pt = points[i]!;
    d += ` L ${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`;
  }
  d += " Z";
  return d;
}
