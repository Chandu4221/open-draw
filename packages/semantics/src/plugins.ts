// Studio wireframe plugin contracts and identifiers (R-044, ADR-0003 D4).
import { parsePluginId, type PluginId, type Shape } from "@open-draw/canvas";
import type { SemanticTag } from "@open-draw/profiles";

export const PLUGIN_SEMANTICS: PluginId = parsePluginId("open-draw:semantics");
export const PLUGIN_ROOT_PLATFORM: PluginId = parsePluginId("open-draw:root-platform");
export const PLUGIN_ROOT_ROLE: PluginId = parsePluginId("open-draw:root-role");
export const PLUGIN_DESIGN_STYLE: PluginId = parsePluginId("open-draw:design-style");
export const PLUGIN_THEME: PluginId = parsePluginId("open-draw:theme");
export const PLUGIN_DARK_MODE: PluginId = parsePluginId("open-draw:dark-mode");

/**
 * Resolves the semantic tag from shape.meta.pluginData with fallback to shape.meta.semantic.
 */
export function getShapeSemantic(shape: Shape | undefined): SemanticTag | undefined {
  if (!shape) return undefined;
  const tag =
    (shape.meta.pluginData?.[PLUGIN_SEMANTICS] as SemanticTag | undefined | null) ??
    (shape.meta.semantic as SemanticTag | undefined | null);
  if (tag === null || tag === undefined) {
    return undefined;
  }
  return tag;
}
