export type ShapeId = string;

export interface Bounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Returns true if container bounds completely enclose inner bounds.
 */
export function boundsContain(container: Bounds, inner: Bounds): boolean {
  return (
    inner.x >= container.x &&
    inner.y >= container.y &&
    inner.x + inner.width <= container.x + container.width &&
    inner.y + inner.height <= container.y + container.height
  );
}
