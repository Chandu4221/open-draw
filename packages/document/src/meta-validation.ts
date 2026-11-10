import type {
  DesignStyleId,
  DeviceType,
  PlatformId,
  PluginId,
  StyleId,
  RootRole,
  ThemePalette,
} from "@open-draw/contracts";
import {
  DESIGN_STYLE_BY_VALUE,
  DEVICE_TYPE_BY_VALUE,
  PLATFORM_BY_VALUE,
  STYLE_PROFILE_BY_VALUE,
  ROOT_ROLE_BY_VALUE,
  THEME_PALETTE_SLOTS,
  isValidPluginId,
} from "@open-draw/contracts";
import { DocumentError } from "./errors";
import type { SemanticTag, ShapeMeta } from "./shape";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function parseDeviceType(value: unknown): DeviceType {
  if (typeof value !== "string") {
    throw new DocumentError(
      "invalidMeta",
      `device type must be a string: ${JSON.stringify(value)}`,
    );
  }
  const deviceType = DEVICE_TYPE_BY_VALUE[value];
  if (deviceType === undefined) {
    throw new DocumentError("invalidMeta", `unknown device type: ${value}`);
  }
  return deviceType;
}

export function parseSemantic(value: unknown): SemanticTag {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.platform !== "string") {
    throw new DocumentError("invalidMeta", "semantic must be { id, platform } with strings");
  }
  const platform =
    PLATFORM_BY_VALUE[value.platform] ??
    (Object.values(PLATFORM_BY_VALUE).includes(value.platform as PlatformId)
      ? (value.platform as PlatformId)
      : undefined);
  if (platform === undefined) {
    throw new DocumentError("invalidMeta", `unknown platform: ${value.platform}`);
  }

  let properties: Record<string, string | number | boolean> | undefined;
  if (value.properties !== undefined) {
    if (!isRecord(value.properties)) {
      throw new DocumentError("invalidMeta", "semantic.properties must be an object");
    }
    properties = {};
    for (const [propKey, propVal] of Object.entries(value.properties)) {
      if (typeof propVal !== "string" && typeof propVal !== "boolean" && !isFiniteNumber(propVal)) {
        throw new DocumentError(
          "invalidMeta",
          `semantic property ${propKey} must be a string, finite number, or boolean`,
        );
      }
      properties[propKey] = propVal;
    }
  }

  return {
    id: value.id,
    platform,
    ...(properties === undefined ? {} : { properties }),
  };
}

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const VALID_THEME_SLOTS = new Set<string>(THEME_PALETTE_SLOTS);

export function parseThemePalette(value: unknown): ThemePalette {
  if (!isRecord(value)) {
    throw new DocumentError("invalidMeta", "meta.theme must be an object");
  }
  const themeObj: Record<string, string> = {};
  for (const [slotKey, slotVal] of Object.entries(value)) {
    if (!VALID_THEME_SLOTS.has(slotKey)) {
      throw new DocumentError("invalidMeta", `unknown theme palette slot: ${slotKey}`);
    }
    if (typeof slotVal !== "string" || !HEX_COLOR_REGEX.test(slotVal)) {
      throw new DocumentError(
        "invalidMeta",
        `meta.theme.${slotKey} must be a valid hex color: ${JSON.stringify(slotVal)}`,
      );
    }
    themeObj[slotKey] = slotVal;
  }
  return themeObj as ThemePalette;
}

export function parseMeta(value: unknown, isRootShape = false): ShapeMeta {
  if (!isRecord(value)) {
    throw new DocumentError("invalidMeta", "meta must be an object");
  }
  if (!isRootShape) {
    if (value.platform !== undefined) {
      throw new DocumentError("invalidMeta", "platform may only be set on root shapes (R-026)");
    }
    if (value.style !== undefined) {
      throw new DocumentError("invalidMeta", "style may only be set on root shapes (R-026)");
    }
    if (value.designStyle !== undefined) {
      throw new DocumentError("invalidMeta", "designStyle may only be set on root shapes (R-026)");
    }
    if (value.role !== undefined) {
      throw new DocumentError("invalidMeta", "role may only be set on root shapes (R-026)");
    }
    if (value.theme !== undefined) {
      throw new DocumentError("invalidMeta", "theme may only be set on root shapes (R-026)");
    }
    if (value.darkMode !== undefined) {
      throw new DocumentError("invalidMeta", "darkMode may only be set on root shapes (R-026)");
    }
  }

  let platform: PlatformId | undefined;
  if (value.platform !== undefined) {
    if (typeof value.platform !== "string") {
      throw new DocumentError("invalidMeta", "meta.platform must be a string");
    }
    platform =
      PLATFORM_BY_VALUE[value.platform] ??
      (Object.values(PLATFORM_BY_VALUE).includes(value.platform as PlatformId)
        ? (value.platform as PlatformId)
        : undefined);
    if (platform === undefined) {
      throw new DocumentError("invalidMeta", `unknown platform: ${value.platform}`);
    }
  }

  let style: StyleId | undefined;
  if (value.style !== undefined) {
    if (typeof value.style !== "string") {
      throw new DocumentError("invalidMeta", "meta.style must be a string");
    }
    style =
      STYLE_PROFILE_BY_VALUE[value.style] ??
      (Object.values(STYLE_PROFILE_BY_VALUE).includes(value.style as StyleId)
        ? (value.style as StyleId)
        : undefined);
    if (style === undefined) {
      throw new DocumentError("invalidMeta", `unknown style: ${value.style}`);
    }
  }

  let designStyle: DesignStyleId | undefined;
  if (value.designStyle !== undefined) {
    if (typeof value.designStyle !== "string") {
      throw new DocumentError("invalidMeta", "meta.designStyle must be a string");
    }
    designStyle =
      DESIGN_STYLE_BY_VALUE[value.designStyle] ??
      (Object.values(DESIGN_STYLE_BY_VALUE).includes(value.designStyle as DesignStyleId)
        ? (value.designStyle as DesignStyleId)
        : undefined);
    if (designStyle === undefined) {
      throw new DocumentError("invalidMeta", `unknown design style: ${value.designStyle}`);
    }
  }

  let role: RootRole | undefined;
  if (value.role !== undefined) {
    if (typeof value.role !== "string") {
      throw new DocumentError("invalidMeta", "meta.role must be a string");
    }
    role =
      ROOT_ROLE_BY_VALUE[value.role] ??
      (Object.values(ROOT_ROLE_BY_VALUE).includes(value.role as RootRole)
        ? (value.role as RootRole)
        : undefined);
    if (role === undefined) {
      throw new DocumentError("invalidMeta", `unknown role: ${value.role}`);
    }
  }

  const order: Partial<Record<DeviceType, number>> = {};
  if (value.order !== undefined) {
    if (!isRecord(value.order)) {
      throw new DocumentError("invalidMeta", "meta.order must be an object");
    }
    for (const [serialized, orderValue] of Object.entries(value.order)) {
      const deviceType = parseDeviceType(serialized);
      if (!isFiniteNumber(orderValue)) {
        throw new DocumentError("invalidMeta", `order for ${serialized} must be a number`);
      }
      order[deviceType] = orderValue;
    }
  }
  let hiddenOn: readonly DeviceType[] | undefined;
  if (value.hiddenOn !== undefined) {
    if (!Array.isArray(value.hiddenOn)) {
      throw new DocumentError("invalidMeta", "meta.hiddenOn must be an array");
    }
    hiddenOn = value.hiddenOn.map(parseDeviceType);
  }
  const semantic =
    value.semantic === undefined || value.semantic === null
      ? undefined
      : parseSemantic(value.semantic);

  // R-044: Validate pluginData envelope (PluginId syntax), but treat contents as opaque
  let pluginData: Record<PluginId, unknown> | undefined;
  if (value.pluginData !== undefined) {
    if (!isRecord(value.pluginData)) {
      throw new DocumentError("invalidMeta", "meta.pluginData must be an object");
    }
    pluginData = {};
    for (const [key, pluginVal] of Object.entries(value.pluginData)) {
      if (!isValidPluginId(key)) {
        throw new DocumentError("invalidMeta", `invalid plugin id in meta.pluginData: ${key}`);
      }
      pluginData[key as PluginId] = pluginVal;
    }
  }

  let theme: ThemePalette | undefined;
  if (value.theme !== undefined) {
    theme = parseThemePalette(value.theme);
  }

  let darkMode: boolean | undefined;
  if (value.darkMode !== undefined) {
    if (typeof value.darkMode !== "boolean") {
      throw new DocumentError("invalidMeta", "meta.darkMode must be a boolean");
    }
    darkMode = value.darkMode;
  }

  return {
    ...(semantic === undefined ? {} : { semantic }),
    order,
    ...(hiddenOn === undefined ? {} : { hiddenOn }),
    ...(pluginData === undefined ? {} : { pluginData }),
    ...(platform === undefined ? {} : { platform }),
    ...(style === undefined ? {} : { style }),
    ...(designStyle === undefined ? {} : { designStyle }),
    ...(role === undefined ? {} : { role }),
    ...(theme === undefined ? {} : { theme }),
    ...(darkMode === undefined ? {} : { darkMode }),
  };
}
