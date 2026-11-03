import { createCanvas, type CanvasController } from "@open-draw/canvas";
import { SHAPE_KINDS } from "@open-draw/contracts";
import type { LineShape, PenPathShape } from "@open-draw/document";
import {
  ELLIPSE_CAPABILITIES,
  hitTestEllipse,
  hitTestLine,
  hitTestPenPath,
  hitTestRect,
  LINE_CAPABILITIES,
  PEN_PATH_CAPABILITIES,
  RECT_CAPABILITIES,
} from "@open-draw/shapes";

export function initCanvas(): CanvasController {
  return createCanvas({
    shapeKinds: [
      {
        kind: SHAPE_KINDS.rect,
        capabilities: RECT_CAPABILITIES,
        hitTest: (box, _shape, pt) => hitTestRect(box, pt),
      },
      {
        kind: SHAPE_KINDS.ellipse,
        capabilities: ELLIPSE_CAPABILITIES,
        hitTest: (box, _shape, pt) => hitTestEllipse(box, pt),
      },
      {
        kind: SHAPE_KINDS.line,
        capabilities: LINE_CAPABILITIES,
        hitTest: (box, shape, pt) => {
          const line = shape as LineShape;
          return hitTestLine(box, line.start, line.end, pt);
        },
      },
      {
        kind: SHAPE_KINDS.penPath,
        capabilities: PEN_PATH_CAPABILITIES,
        hitTest: (box, shape, pt) => {
          const pen = shape as PenPathShape;
          return hitTestPenPath(box, pen.points, pt);
        },
      },
    ],
  });
}
