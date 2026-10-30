// The shape union and validating constructors (ADR-0002 D3–D7). Invariants
// live in types; constructors validate at the boundary and internal code
// trusts the result (R-006, R-008).
import type { BoundingBox, DeviceType, PlatformId, ShapeId, ShapeKind } from "@open-draw/contracts";
import { ROOT_ID, SHAPE_KINDS, isRootId } from "@open-draw/contracts";
import { DocumentError } from "./errors";

// Section flow direction: stored and validated now, consumed by the derive
// pipeline later (ADR-0002 D7).
export const SECTION_DIRECTIONS = {
  row: "row",
  column: "column",
} as const;

export type SectionDirection = keyof typeof SECTION_DIRECTIONS;

export interface SemanticTag {
  readonly id: string;
  readonly platform: PlatformId;
}

// meta absent semantic = NONE (R-024); absent hiddenOn = visible everywhere
// (R-028); absent order entry = 0 (one mechanism, two uses — ADR-0002 D6).
// `style` (local render-style override, R-026) is deferred to the profiles
// milestone: StyleId has no registry yet.
export interface ShapeMeta {
  readonly semantic?: SemanticTag;
  readonly order: Partial<Record<DeviceType, number>>;
  readonly hiddenOn?: readonly DeviceType[];
}

export interface BaseShape {
  readonly id: ShapeId;
  readonly kind: ShapeKind;
  readonly parent: ShapeId;
  readonly boundingBox: BoundingBox;
  readonly label?: string;
  readonly meta: ShapeMeta;
}

export interface PageShape extends BaseShape {
  readonly kind: "page";
}

export interface SectionShape extends BaseShape {
  readonly kind: "section";
  readonly direction: SectionDirection;
}

export interface RectShape extends BaseShape {
  readonly kind: "rect";
}

export interface EllipseShape extends BaseShape {
  readonly kind: "ellipse";
}

export type Shape = PageShape | SectionShape | RectShape | EllipseShape;

export interface ShapeInit {
  readonly parent?: ShapeId;
  readonly label?: string;
  readonly meta?: ShapeMeta;
}

const DEFAULT_META: ShapeMeta = { order: {} };

function baseInit(
  id: ShapeId,
  kind: ShapeKind,
  boundingBox: BoundingBox,
  init: ShapeInit,
): BaseShape {
  if (isRootId(id)) {
    throw new DocumentError("invalidShape", `a shape may not use the root id: ${id}`);
  }
  return {
    id,
    kind,
    parent: init.parent ?? ROOT_ID,
    boundingBox,
    ...(init.label === undefined ? {} : { label: init.label }),
    meta: init.meta ?? DEFAULT_META,
  };
}

export function createPage(id: ShapeId, boundingBox: BoundingBox, init: ShapeInit = {}): PageShape {
  return Object.freeze({
    ...baseInit(id, SHAPE_KINDS.page, boundingBox, init),
    kind: SHAPE_KINDS.page,
  });
}

export function createSection(
  id: ShapeId,
  boundingBox: BoundingBox,
  direction: SectionDirection,
  init: ShapeInit = {},
): SectionShape {
  return Object.freeze({
    ...baseInit(id, SHAPE_KINDS.section, boundingBox, init),
    kind: SHAPE_KINDS.section,
    direction,
  });
}

export function createRect(id: ShapeId, boundingBox: BoundingBox, init: ShapeInit = {}): RectShape {
  return Object.freeze({
    ...baseInit(id, SHAPE_KINDS.rect, boundingBox, init),
    kind: SHAPE_KINDS.rect,
  });
}

export function createEllipse(
  id: ShapeId,
  boundingBox: BoundingBox,
  init: ShapeInit = {},
): EllipseShape {
  return Object.freeze({
    ...baseInit(id, SHAPE_KINDS.ellipse, boundingBox, init),
    kind: SHAPE_KINDS.ellipse,
  });
}
