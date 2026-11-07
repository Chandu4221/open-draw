// SVG rendering of the canonical document (R-016: SVG is a rendering result,
// never truth; R-020: the renderer never holds canonical state; ADR-0003 D3).
// Pure Document → string (R-008). Presentation constants are registry data, not
// stringly internals (R-005).
import type {
  BoundingBox,
  BuiltinShapeKind,
  DeviceType,
  ShapeId,
  StyleId,
} from "@open-draw/contracts";
import { isRootId, SHAPE_KINDS, SHAPE_KIND_LABELS, STYLE_PROFILES } from "@open-draw/contracts";
import {
  absoluteBoundingBox,
  ancestorsOf,
  shapeListInOrder,
  type Document,
  type LineShape,
  type PenPathShape,
  type Shape,
} from "@open-draw/document";
import { CRAYON_SHAPE_RENDERERS } from "./styles/crayon";
import { escapeXml } from "./escape-xml";

export const RENDER_STYLES = {
  contentFill: "#ffffff",
  contentStroke: "#1f2933",
  pageFill: "none",
  pageStroke: "#8a94a6",
  pageDasharray: "8 6",
  sectionFill: "#f5f7fa",
  sectionStroke: "#8a94a6",
  selectionStroke: "#2563eb",
  selectionDasharray: "4 4",
  handleFill: "#2563eb",
  fallbackFill: "none",
  fallbackStroke: "#94a3b8",
  fallbackDasharray: "4 4",
} as const;

export interface RendererFallbackEvent {
  readonly shapeId: ShapeId;
  readonly kind: string;
}

export type ShapeSvgRenderer = (shape: Shape, box: BoundingBox) => string;

export interface RenderOptions {
  readonly activeDeviceType?: DeviceType | undefined;
  readonly activeDeviceTypes?: Readonly<Record<ShapeId, DeviceType | undefined>> | undefined;
  readonly styleProfile?: StyleId | undefined;
  readonly onFallback?: (event: RendererFallbackEvent) => void;
  readonly customRenderers?: Readonly<Record<string, ShapeSvgRenderer>>;
}

export function fallbackShapeToSvg(shape: Shape, box: BoundingBox): string {
  const label =
    shape.kind in SHAPE_KIND_LABELS
      ? SHAPE_KIND_LABELS[shape.kind as BuiltinShapeKind]
      : shape.kind;
  const safeLabel = escapeXml(label);
  const rect = `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${RENDER_STYLES.fallbackFill}" stroke="${RENDER_STYLES.fallbackStroke}" stroke-dasharray="${RENDER_STYLES.fallbackDasharray}" />`;
  const text = `<text x="${box.x + 8}" y="${box.y + 18}" font-family="sans-serif" font-size="12" fill="${RENDER_STYLES.fallbackStroke}">[${safeLabel}]</text>`;
  return rect + text;
}

export const DEFAULT_SHAPE_RENDERERS: Readonly<Record<string, ShapeSvgRenderer>> = Object.freeze({
  [SHAPE_KINDS.page]: (_shape, box) =>
    `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${RENDER_STYLES.pageFill}" stroke="${RENDER_STYLES.pageStroke}" stroke-dasharray="${RENDER_STYLES.pageDasharray}" />`,
  [SHAPE_KINDS.section]: (_shape, box) =>
    `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${RENDER_STYLES.sectionFill}" stroke="${RENDER_STYLES.sectionStroke}" />`,
  [SHAPE_KINDS.rect]: (shape, box) => {
    const fill = escapeXml(shape.fill ?? RENDER_STYLES.contentFill);
    const stroke = escapeXml(shape.stroke ?? RENDER_STYLES.contentStroke);
    const strokeWidthAttr =
      shape.strokeWidth !== undefined ? ` stroke-width="${shape.strokeWidth}"` : "";
    return `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${fill}" stroke="${stroke}"${strokeWidthAttr} />`;
  },
  [SHAPE_KINDS.ellipse]: (shape, box) => {
    const fill = escapeXml(shape.fill ?? RENDER_STYLES.contentFill);
    const stroke = escapeXml(shape.stroke ?? RENDER_STYLES.contentStroke);
    const strokeWidthAttr =
      shape.strokeWidth !== undefined ? ` stroke-width="${shape.strokeWidth}"` : "";
    return `<ellipse cx="${box.x + box.width / 2}" cy="${box.y + box.height / 2}" rx="${box.width / 2}" ry="${box.height / 2}" fill="${fill}" stroke="${stroke}"${strokeWidthAttr} />`;
  },
  [SHAPE_KINDS.line]: (shape, box) => {
    const line = shape as LineShape;
    const stroke = escapeXml(shape.stroke ?? RENDER_STYLES.contentStroke);
    const strokeWidth = shape.strokeWidth ?? 2;
    return `<line x1="${box.x + line.start.x}" y1="${box.y + line.start.y}" x2="${box.x + line.end.x}" y2="${box.y + line.end.y}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
  },
  [SHAPE_KINDS.penPath]: (shape, box) => {
    const pen = shape as PenPathShape;
    const pointsStr = pen.points.map((p) => `${box.x + p.x},${box.y + p.y}`).join(" ");
    const stroke = escapeXml(shape.stroke ?? RENDER_STYLES.contentStroke);
    const strokeWidth = shape.strokeWidth ?? 2;
    const fill = escapeXml(shape.fill ?? "none");
    return `<polyline points="${pointsStr}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
  },
  [SHAPE_KINDS.text]: (shape, box) => {
    if (shape.fill !== undefined && shape.fill !== "none" && shape.fill !== "transparent") {
      const fill = escapeXml(shape.fill);
      const stroke = shape.stroke ? ` stroke="${escapeXml(shape.stroke)}"` : "";
      return `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${fill}"${stroke} />`;
    }
    return "";
  },
});

/**
 * Resolves the effective style profile for a shape from its root ancestor (R-026).
 */
export function resolveEffectiveStyle(doc: Document, shape: Shape): StyleId {
  if (isRootId(shape.parentId)) {
    return shape.meta.style ?? STYLE_PROFILES.minimal;
  }
  const ancestors = ancestorsOf(doc, shape);
  const root = ancestors[ancestors.length - 1];
  return root?.meta.style ?? STYLE_PROFILES.minimal;
}

export function shapeToSvg(shape: Shape, box: BoundingBox, options?: RenderOptions): string {
  let renderer: ShapeSvgRenderer | undefined;

  if (options?.customRenderers?.[shape.kind] !== undefined) {
    renderer = options.customRenderers[shape.kind];
  } else if (options?.styleProfile === STYLE_PROFILES.crayon) {
    renderer = CRAYON_SHAPE_RENDERERS[shape.kind] ?? DEFAULT_SHAPE_RENDERERS[shape.kind];
  } else {
    renderer = DEFAULT_SHAPE_RENDERERS[shape.kind];
  }

  let rendered: string;
  if (renderer !== undefined) {
    rendered = renderer(shape, box);
  } else {
    options?.onFallback?.({ shapeId: shape.id, kind: shape.kind });
    rendered = fallbackShapeToSvg(shape, box);
  }

  // Visible text on shapes (F2, ADR-0006 Option A / shape.content)
  if (shape.content !== undefined && shape.content !== null && shape.content.trim().length > 0) {
    const clipId = `clip-${escapeXml(shape.id)}`;
    const clip = `<clipPath id="${clipId}"><rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" /></clipPath>`;
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const textColor = escapeXml(
      shape.stroke && shape.stroke !== "none" ? shape.stroke : RENDER_STYLES.contentStroke,
    );
    const text = `<text x="${centerX}" y="${centerY}" dominant-baseline="central" text-anchor="middle" font-family="sans-serif" font-size="14" fill="${textColor}" clip-path="url(#${clipId})">${escapeXml(shape.content)}</text>`;
    rendered = `${rendered}${clip}${text}`;
  }

  // R-029: Presentation-only ghost rendering for shapes hidden on active device type
  if (
    options?.activeDeviceType !== undefined &&
    shape.meta.hiddenOn?.includes(options.activeDeviceType)
  ) {
    return `<g opacity="0.35" stroke-dasharray="4 4">${rendered}</g>`;
  }
  return rendered;
}

function resolveShapeRootId(document: Document, shape: Shape): ShapeId | undefined {
  if (isRootId(shape.parentId)) {
    return shape.id;
  }
  const ancestors = ancestorsOf(document, shape);
  const root = ancestors.find((a) => isRootId(a.parentId));
  return root?.id;
}

// The whole document in pre-order walk order (structural order).
// Style selection is root-resolved (R-026).
// Fallback emission surfaces via the pure options callback without singletons (R-008, ADR-0003 D3).
export function documentToSvg(document: Document, options?: RenderOptions): string {
  return shapeListInOrder(document)
    .map((shape) => {
      const effectiveStyle = options?.styleProfile ?? resolveEffectiveStyle(document, shape);
      const rootId = resolveShapeRootId(document, shape);
      const effectiveDevice =
        rootId !== undefined && options?.activeDeviceTypes !== undefined
          ? (options.activeDeviceTypes[rootId] ?? options?.activeDeviceType)
          : options?.activeDeviceType;

      const shapeOptions: RenderOptions | undefined =
        effectiveStyle !== options?.styleProfile || effectiveDevice !== options?.activeDeviceType
          ? { ...options, styleProfile: effectiveStyle, activeDeviceType: effectiveDevice }
          : options;
      return shapeToSvg(shape, absoluteBoundingBox(document, shape), shapeOptions);
    })
    .join("");
}
