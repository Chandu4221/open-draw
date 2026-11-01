// Style rendering contracts (ADR-0005 D3, D4).
// Pure data types and registries, zero dependencies (R-002, R-005, R-021).
import type { StyleId } from "./profile-contract";

/**
 * Context provided to style-specific renderers.
 */
export interface StyleRenderContext {
  readonly seed?: number;
  readonly zoom?: number;
}

/**
 * Pure function rendering a shape in a specific style (R-008, R-021).
 */
export type StyleShapeRenderer<TShape = unknown, TBox = unknown> = (
  shape: TShape,
  box: TBox,
  context?: StyleRenderContext,
) => string;

/**
 * Registry of shape renderers for a specific style profile.
 */
export type StyleRendererMap<TShape = unknown, TBox = unknown> = Readonly<
  Record<string, StyleShapeRenderer<TShape, TBox>>
>;

/**
 * Style render extension definition.
 */
export interface StyleRenderExtension<TShape = unknown, TBox = unknown> {
  readonly styleId: StyleId;
  readonly renderers: StyleRendererMap<TShape, TBox>;
}
