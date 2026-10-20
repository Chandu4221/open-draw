import { InvalidBoundsError } from './errors.js';
import type { Bounds, Point } from './types.js';

/**
 * Validates that bounds have non-negative dimensions and finite coordinates.
 * Throws InvalidBoundsError if invalid.
 */
export function validateBounds(bounds: Bounds): void {
  if (
    !Number.isFinite(bounds.x) ||
    !Number.isFinite(bounds.y) ||
    !Number.isFinite(bounds.width) ||
    !Number.isFinite(bounds.height)
  ) {
    throw new InvalidBoundsError(
      `Bounds coordinates and dimensions must be finite numbers. Received: ${JSON.stringify(bounds)}`
    );
  }

  if (bounds.width < 0 || bounds.height < 0) {
    throw new InvalidBoundsError(
      `Bounds width and height cannot be negative. Received width=${bounds.width}, height=${bounds.height}`
    );
  }
}

/**
 * Creates and validates a Bounds object.
 */
export function boundsOf(x: number, y: number, width: number, height: number): Bounds {
  const b: Bounds = { x, y, width, height };
  validateBounds(b);
  return b;
}

/**
 * Computes bounding box enclosing an array of points.
 */
export function boundsFromPoints(points: ReadonlyArray<Point>): Bounds {
  if (points.length === 0) {
    return boundsOf(0, 0, 0, 0);
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
      throw new InvalidBoundsError(`Point coordinates must be finite. Received: ${JSON.stringify(p)}`);
    }
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return boundsOf(minX, minY, maxX - minX, maxY - minY);
}

/**
 * Computes the center of a bounding box.
 */
export function boundsCenter(bounds: Bounds): Point {
  validateBounds(bounds);
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
}

/**
 * Translates bounds by dx and dy.
 */
export function translateBounds(bounds: Bounds, dx: number, dy: number): Bounds {
  validateBounds(bounds);
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
    throw new InvalidBoundsError(`Translation deltas must be finite numbers. Received dx=${dx}, dy=${dy}`);
  }
  return boundsOf(bounds.x + dx, bounds.y + dy, bounds.width, bounds.height);
}

/**
 * Inflates (expands) or deflates (contracts) bounds by dx and dy on each side.
 */
export function inflate(bounds: Bounds, dx: number, dy: number): Bounds {
  validateBounds(bounds);
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
    throw new InvalidBoundsError(`Inflation deltas must be finite numbers. Received dx=${dx}, dy=${dy}`);
  }
  return boundsOf(
    bounds.x - dx,
    bounds.y - dy,
    bounds.width + 2 * dx,
    bounds.height + 2 * dy
  );
}

/**
 * Boundary semantics: inclusive of top-left, exclusive of bottom-right [x, x+width) × [y, y+height).
 */
export function pointInBounds(point: Point, bounds: Bounds): boolean {
  validateBounds(bounds);
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new InvalidBoundsError(`Point coordinates must be finite. Received: ${JSON.stringify(point)}`);
  }

  if (bounds.width === 0 || bounds.height === 0) {
    return false;
  }

  return (
    point.x >= bounds.x &&
    point.x < bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y < bounds.y + bounds.height
  );
}

/**
 * Returns true if container bounds completely enclose inner bounds.
 * Boundary semantics: inclusive of top-left, exclusive of bottom-right.
 */
export function boundsContain(container: Bounds, inner: Bounds): boolean {
  validateBounds(container);
  validateBounds(inner);

  return (
    inner.x >= container.x &&
    inner.y >= container.y &&
    inner.x + inner.width <= container.x + container.width &&
    inner.y + inner.height <= container.y + container.height
  );
}

/**
 * Tests whether two bounds intersect.
 * Touching edges do not intersect under half-open semantics [x, x+width).
 */
export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  validateBounds(a);
  validateBounds(b);

  if (a.width === 0 || a.height === 0 || b.width === 0 || b.height === 0) {
    return false;
  }

  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Computes the minimum bounding box that encloses both a and b.
 */
export function boundsUnion(a: Bounds, b: Bounds): Bounds {
  validateBounds(a);
  validateBounds(b);

  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxX = Math.max(a.x + a.width, b.x + b.width);
  const maxY = Math.max(a.y + a.height, b.y + b.height);

  return boundsOf(minX, minY, maxX - minX, maxY - minY);
}

/**
 * Frame containment helper: checks if frame contains shape bounds.
 */
export function frameContains(frame: Bounds, shape: Bounds): boolean {
  return boundsContain(frame, shape);
}
