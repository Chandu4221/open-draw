import type { BoundingBox, Point, ShapeId } from "@open-draw/canvas";
import type { GestureKind, HandleId } from "@open-draw/canvas";

export interface Gesture {
  readonly kind: GestureKind;
  readonly startScreen: Point;
  readonly startWorld: Point;
  readonly shapeIds: readonly ShapeId[];
  readonly handleId: HandleId | null;
  readonly originalBox: BoundingBox | null;
  readonly parentHit: ShapeId | null;
  readonly targetShapeId: ShapeId | null;
  readonly points: readonly Point[];
}

export const CANVAS_WIRE_STYLE = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  display: "block",
  touchAction: "none",
};

export const CANVAS_CONTAINER_STYLE: React.CSSProperties = {
  flex: 1,
  height: "100%",
  minHeight: 0,
  minWidth: 0,
  position: "relative",
  overflow: "hidden",
};
