// Geometry value types (ADR-0002 D4). A BoundingBox is NOT the rectangle
// shape — it is the positional frame of EVERY shape (position + extent),
// expressed in the parent's local coordinate space. The rect/ellipse glyph
// renders inside its bounding box; hit-testing, resize, and reflow address
// the bounding box. Absolute page positions are always derived
// (see document/tree.ts).
export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface BoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
