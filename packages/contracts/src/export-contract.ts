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
 * Options passed to exporter functions.
 */
export interface ExportOptions {
  readonly includeHeader?: boolean;
}

/**
 * Generic contract for a pure document exporter function.
 * Pure Document → string projection (R-008, R-016).
 */
export type Exporter<TDoc = unknown, TOptions extends ExportOptions = ExportOptions> = (
  document: TDoc,
  options?: TOptions,
) => string;
