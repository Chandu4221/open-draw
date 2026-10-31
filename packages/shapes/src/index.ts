// @open-draw/shapes — built-in shape kind modules (rect, ellipse, line, pen-path).
// Implements ADR-0003 D1, D5, D6. Depends ONLY on @open-draw/contracts (R-002, R-020).
import type { CapabilityId } from "@open-draw/contracts";
import { RECT_CAPABILITIES } from "./rect";
import { ELLIPSE_CAPABILITIES } from "./ellipse";
import { LINE_CAPABILITIES } from "./line";
import { PEN_PATH_CAPABILITIES } from "./pen-path";

export * as rectShape from "./rect";
export * as ellipseShape from "./ellipse";
export * as lineShape from "./line";
export * as penPathShape from "./pen-path";

export { RECT_KIND, RECT_CAPABILITIES, hitTestRect } from "./rect";
export { ELLIPSE_KIND, ELLIPSE_CAPABILITIES, hitTestEllipse } from "./ellipse";
export {
  LINE_KIND,
  LINE_CAPABILITIES,
  distanceToSegment,
  deriveLineBoundingBox,
  scaleLineEndpointsForBox,
  hitTestLine,
} from "./line";
export {
  PEN_PATH_KIND,
  PEN_PATH_CAPABILITIES,
  derivePenPathBoundingBox,
  scalePenPathPointsForBox,
  hitTestPenPath,
} from "./pen-path";

export interface ShapeDefinition {
  readonly kind: string;
  readonly capabilities: readonly CapabilityId[];
}

export const BUILTIN_SHAPE_CAPABILITIES: Readonly<Record<string, readonly CapabilityId[]>> =
  Object.freeze({
    rect: RECT_CAPABILITIES,
    ellipse: ELLIPSE_CAPABILITIES,
    line: LINE_CAPABILITIES,
    "pen-path": PEN_PATH_CAPABILITIES,
  });
