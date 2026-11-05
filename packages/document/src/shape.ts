// The shape union and validating constructors (ADR-0002 D3–D7, ADR-0003 D1–D5).
// Invariants live in types; constructors validate at the boundary and internal
// code trusts the result (R-006, R-008).
import type {
  BoundingBox,
  CustomShapeKind,
  DeviceType,
  PlatformId,
  PluginId,
  Point,
  ShapeId,
  ShapeKind,
  StyleId,
  DesignStyleId,
  RootRole,
} from "@open-draw/contracts";
import { ROOT_ID, SHAPE_KINDS, SHAPE_KIND_VALUES, isRootId } from "@open-draw/contracts";
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
  readonly properties?: Readonly<Record<string, string | number | boolean>>;
}

// meta absent semantic = NONE (R-024); absent hiddenOn = visible everywhere
// (R-028); absent order entry = 0 (one mechanism, two uses — ADR-0002 D6).
// `pluginData`: opaque forward-compatibility namespace (R-044, ADR-0003 D4).
// `platform` and `style`: settable on root pages only, inherited by tree position (R-026, ADR-0004 D7).
// `designStyle`: aesthetic style specification for AI/developer handoff (R-026).
export interface ShapeMeta {
  readonly semantic?: SemanticTag;
  readonly order: Partial<Record<DeviceType, number>>;
  readonly hiddenOn?: readonly DeviceType[];
  readonly pluginData?: Readonly<Record<PluginId, unknown>>;
  readonly platform?: PlatformId;
  readonly style?: StyleId;
  readonly designStyle?: DesignStyleId;
  readonly role?: RootRole;
}

export interface BaseShape {
  readonly id: ShapeId;
  readonly kind: ShapeKind;
  readonly parentId: ShapeId;
  readonly boundingBox: BoundingBox;
  readonly label?: string;
  readonly content?: string;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly meta: ShapeMeta;
}

export const BASE_SHAPE_KEYS = {
  id: "id",
  kind: "kind",
  parentId: "parentId",
  boundingBox: "boundingBox",
  label: "label",
  content: "content",
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  meta: "meta",
} as const satisfies Record<keyof BaseShape, string>;

export const BASE_SHAPE_KEY_SET: ReadonlySet<string> = new Set(Object.values(BASE_SHAPE_KEYS));

export interface PageShape extends BaseShape {
  readonly kind: (typeof SHAPE_KINDS)["page"];
}

export interface SectionShape extends BaseShape {
  readonly kind: (typeof SHAPE_KINDS)["section"];
  readonly direction: SectionDirection;
}

export interface RectShape extends BaseShape {
  readonly kind: (typeof SHAPE_KINDS)["rect"];
}

export interface EllipseShape extends BaseShape {
  readonly kind: (typeof SHAPE_KINDS)["ellipse"];
}

export interface LineShape extends BaseShape {
  readonly kind: (typeof SHAPE_KINDS)["line"];
  readonly start: Point;
  readonly end: Point;
}

export interface PenPathShape extends BaseShape {
  readonly kind: (typeof SHAPE_KINDS)["penPath"];
  readonly points: readonly Point[];
}

export interface CustomShape extends BaseShape {
  readonly kind: CustomShapeKind;
  readonly customData?: Readonly<Record<string, unknown>>;
}

export type BuiltinShape =
  PageShape | SectionShape | RectShape | EllipseShape | LineShape | PenPathShape;

export type Shape = BuiltinShape | CustomShape;

export function isCustomShape(shape: Shape): shape is CustomShape {
  return !SHAPE_KIND_VALUES.has(shape.kind);
}

export interface ShapeInit {
  readonly parentId?: ShapeId;
  readonly parent?: ShapeId;
  readonly label?: string;
  readonly content?: string;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
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
    parentId: init.parentId ?? init.parent ?? ROOT_ID,
    boundingBox,
    ...(init.label === undefined ? {} : { label: init.label }),
    ...(init.content === undefined ? {} : { content: init.content }),
    ...(init.fill === undefined ? {} : { fill: init.fill }),
    ...(init.stroke === undefined ? {} : { stroke: init.stroke }),
    ...(init.strokeWidth === undefined ? {} : { strokeWidth: init.strokeWidth }),
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

export function createLine(
  id: ShapeId,
  boundingBox: BoundingBox,
  start: Point,
  end: Point,
  init: ShapeInit = {},
): LineShape {
  return Object.freeze({
    ...baseInit(id, SHAPE_KINDS.line, boundingBox, init),
    kind: SHAPE_KINDS.line,
    start: Object.freeze({ x: start.x, y: start.y }),
    end: Object.freeze({ x: end.x, y: end.y }),
  });
}

export function createPenPath(
  id: ShapeId,
  boundingBox: BoundingBox,
  points: readonly Point[],
  init: ShapeInit = {},
): PenPathShape {
  return Object.freeze({
    ...baseInit(id, SHAPE_KINDS.penPath, boundingBox, init),
    kind: SHAPE_KINDS.penPath,
    points: Object.freeze(points.map((p) => Object.freeze({ x: p.x, y: p.y }))),
  });
}

export function createCustomShape(
  id: ShapeId,
  kind: CustomShapeKind,
  boundingBox: BoundingBox,
  customData: Readonly<Record<string, unknown>> = {},
  init: ShapeInit = {},
): CustomShape {
  return Object.freeze({
    ...baseInit(id, kind, boundingBox, init),
    kind,
    customData: Object.freeze({ ...customData }),
  });
}
