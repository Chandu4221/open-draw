// Export format registry and contracts (ADR-0005 D1).
// Zero dependencies, pure data types and registries (R-002, R-005, R-007).

/**
 * Closed registry of supported export formats.
 */
export const EXPORT_FORMATS = {
  json: "json",
  markdown: "markdown",
} as const;

export type ExportFormat = keyof typeof EXPORT_FORMATS;

export const EXPORT_FORMAT_BY_VALUE: Readonly<Record<string, ExportFormat>> = Object.fromEntries(
  (Object.keys(EXPORT_FORMATS) as ExportFormat[]).map((format) => [EXPORT_FORMATS[format], format]),
);

export function isExportFormat(value: string): value is ExportFormat {
  return value in EXPORT_FORMAT_BY_VALUE;
}

/**
 * Closed registry of AI creativity levels (5 levels).
 * Defines how much latitude the AI should take when implementing a wireframe.
 */
export const CREATIVITY_LEVELS = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
} as const;

export type CreativityLevel = (typeof CREATIVITY_LEVELS)[keyof typeof CREATIVITY_LEVELS];

export interface CreativityLevelDefinition {
  readonly level: CreativityLevel;
  readonly name: string;
  readonly description: string;
  readonly promptDirective: string;
}

export const CREATIVITY_LEVEL_DEFINITIONS: Readonly<
  Record<CreativityLevel, CreativityLevelDefinition>
> = {
  1: {
    level: 1,
    name: "Strict",
    description: "Replicate wireframe components and structure with zero deviations.",
    promptDirective:
      "Follow the wireframe structure, component hierarchy, and specified properties exactly. Do not add, omit, or modify any elements. Treat the layout as an absolute requirement with zero deviations.",
  },
  2: {
    level: 2,
    name: "Precise",
    description:
      "Follow wireframe hierarchy strictly; apply standard spacing and component styling.",
    promptDirective:
      "Follow the wireframe component hierarchy strictly. You may apply standard design system spacing, alignment, and semantic color tokens, but do not add new components or change the intended flow.",
  },
  3: {
    level: 3,
    name: "Balanced",
    description:
      "Standard UX best practices; flesh out standard states (hover, loading, empty states).",
    promptDirective:
      "Interpret the wireframe using standard UX best practices. Preserve all core components and structure while implementing essential missing states (e.g. hover states, loading skeletons, error indicators, empty states).",
  },
  4: {
    level: 4,
    name: "Exploratory",
    description: "Suggest rich interactions, component enhancements, and responsive layout polish.",
    promptDirective:
      "Enhance the wireframe with modern interactive polish. You may introduce secondary UI controls, progressive disclosure, animations, responsive adaptive layouts, and rich data-display components while respecting the original user intent.",
  },
  5: {
    level: 5,
    name: "Imaginative",
    description:
      "Treat the wireframe as conceptual inspiration; propose novel layouts and interactions.",
    promptDirective:
      "Treat this wireframe as high-level conceptual guidance. Feel free to rethink the information architecture, invent novel interactions, and propose elevated visual patterns that achieve the core objective in a creative way.",
  },
} as const;

export const DEFAULT_CREATIVITY_LEVEL: CreativityLevel = 3;

/**
 * Options passed to exporter functions.
 */
export interface ExportOptions {
  readonly includeHeader?: boolean;
  readonly creativityLevel?: CreativityLevel;
}

/**
 * Generic contract for a pure document exporter function.
 * Pure Document → string projection (R-008, R-016).
 */
export type Exporter<TDoc = unknown, TOptions extends ExportOptions = ExportOptions> = (
  document: TDoc,
  options?: TOptions,
) => string;
