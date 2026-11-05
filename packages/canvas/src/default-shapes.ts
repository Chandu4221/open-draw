// Default built-in shape kind registrations for @open-draw/canvas (ADR-0008 D4).
// Provides batteries-included out-of-the-box hit testing and capability resolution.
import { SHAPE_KINDS } from "@open-draw/contracts";
import type { LineShape, PenPathShape } from "@open-draw/document";
import {
  ELLIPSE_CAPABILITIES,
  hitTestEllipse,
  hitTestLine,
  hitTestPenPath,
  hitTestRect,
  hitTestText,
  LINE_CAPABILITIES,
  PEN_PATH_CAPABILITIES,
  RECT_CAPABILITIES,
  TEXT_CAPABILITIES,
} from "@open-draw/shapes";
import type { ShapeKindRegistration } from "./register-shape-kind";

export const DEFAULT_SHAPE_REGISTRATIONS: readonly ShapeKindRegistration[] = Object.freeze([
  {
    kind: SHAPE_KINDS.rect,
    capabilities: RECT_CAPABILITIES,
    hitTest: (box, _shape, point) => hitTestRect(box, point),
  },
  {
    kind: SHAPE_KINDS.ellipse,
    capabilities: ELLIPSE_CAPABILITIES,
    hitTest: (box, _shape, point) => hitTestEllipse(box, point),
  },
  {
    kind: SHAPE_KINDS.line,
    capabilities: LINE_CAPABILITIES,
    hitTest: (box, shape, point) => {
      const line = shape as LineShape;
      return hitTestLine(box, line.start, line.end, point);
    },
  },
  {
    kind: SHAPE_KINDS.penPath,
    capabilities: PEN_PATH_CAPABILITIES,
    hitTest: (box, shape, point) => {
      const pen = shape as PenPathShape;
      return hitTestPenPath(box, pen.points, point);
    },
  },
  {
    kind: SHAPE_KINDS.text,
    capabilities: TEXT_CAPABILITIES,
    hitTest: (box, _shape, point) => hitTestText(box, point),
  },
]);
