// Plugin contracts and branded plugin identifiers (ADR-0003 D4, R-006, R-044).
// Plugin ids are namespaced "<scope>:<name>" kebab-case branded strings.
export type PluginId = string & { readonly __brand: "PluginId" };

export const PLUGIN_CONTRACT_VERSION = 1;

const PLUGIN_ID_PATTERN = /^[a-z0-9-]+:[a-z0-9-]+$/;

export function isValidPluginId(value: string): boolean {
  return PLUGIN_ID_PATTERN.test(value);
}

// Boundary conversion: validates candidate plugin id and brands it.
// Fails loudly on invalid syntax (R-006).
export function parsePluginId(value: unknown): PluginId {
  if (typeof value !== "string" || !PLUGIN_ID_PATTERN.test(value)) {
    throw new Error(`parsePluginId: invalid plugin id: ${JSON.stringify(value)}`);
  }
  return value as PluginId;
}

export interface PluginContract {
  readonly id: PluginId;
  readonly contractVersion: typeof PLUGIN_CONTRACT_VERSION;
  readonly name?: string;
  readonly description?: string;
}
