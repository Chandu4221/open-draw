import type { Bounds, Point, ShapeId, ShapeRecord } from '@open-draw/schema';

export type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right';

export interface RenderContext {
  readonly isSelected?: boolean;
  readonly overlaySlot?: SVGGElement;
}

export interface InteractionContext {
  readonly editor: unknown;
}

export interface ShapeGeometry<P = Record<string, unknown>> {
  bounds(shape: ShapeRecord<P>): Bounds;
  resize(shape: ShapeRecord<P>, handle: ResizeHandle, point: Point): Partial<ShapeRecord<P>>;
  hit(shape: ShapeRecord<P>, point: Point): boolean;
}

export interface TextCapability<P = Record<string, unknown>> {
  canEditText(shape: ShapeRecord<P>): boolean;
  getText(shape: ShapeRecord<P>): string;
  setText(shape: ShapeRecord<P>, text: string): Partial<ShapeRecord<P>>;
  getTextBounds?(shape: ShapeRecord<P>): Bounds;
}

export interface ConnectorCapability<P = Record<string, unknown>> {
  getSnapPoints(shape: ShapeRecord<P>): Point[];
  getConnectionAnchor(shape: ShapeRecord<P>, target: Point): Point;
}

export interface ClippingCapability<P = Record<string, unknown>> {
  getClipPath(shape: ShapeRecord<P>): string | null;
  isMask(shape: ShapeRecord<P>): boolean;
}

export interface ShapeCapabilities<P = Record<string, unknown>> {
  readonly text?: TextCapability<P>;
  readonly connector?: ConnectorCapability<P>;
  readonly clipping?: ClippingCapability<P>;
}

export interface ShapeDefinition<P = Record<string, unknown>> {
  readonly type: string;
  readonly defaultProps: () => P;
  readonly geometry: ShapeGeometry<P>;
  render(shape: ShapeRecord<P>, ctx: RenderContext): SVGElement | SVGElement[];
  update?(element: SVGElement, shape: ShapeRecord<P>, prevShape: ShapeRecord<P>, ctx: RenderContext): void;
  doubleClick?(shape: ShapeRecord<P>, event: MouseEvent, ctx: InteractionContext): void;
  readonly lockAspect?: boolean;
  readonly capabilities?: ShapeCapabilities<P>;
}

export class DuplicateShapeTypeError extends Error {
  readonly shapeType: string;

  constructor(shapeType: string) {
    super(`Shape type "${shapeType}" is already registered. Types must be unique.`);
    this.name = 'DuplicateShapeTypeError';
    this.shapeType = shapeType;
  }
}

/**
 * ShapeRegistry manages all registered shape definitions.
 * Ensures zero hardcoded shape types in engine core.
 */
export class ShapeRegistry {
  private readonly definitions = new Map<string, ShapeDefinition<any>>();

  register<P = Record<string, unknown>>(definition: ShapeDefinition<P>): void {
    if (this.definitions.has(definition.type)) {
      throw new DuplicateShapeTypeError(definition.type);
    }
    this.definitions.set(definition.type, definition);
  }

  get<P = Record<string, unknown>>(type: string): ShapeDefinition<P> | undefined {
    return this.definitions.get(type) as ShapeDefinition<P> | undefined;
  }

  has(type: string): boolean {
    return this.definitions.has(type);
  }

  list(): ReadonlyArray<ShapeDefinition<any>> {
    return Array.from(this.definitions.values());
  }

  clear(): void {
    this.definitions.clear();
  }
}
