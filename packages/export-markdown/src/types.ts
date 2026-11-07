// Types and options for structured Markdown export (ADR-0005 D1, D2).
import type { DeviceType, ExportOptions, ShapeId } from "@open-draw/contracts";

export interface MarkdownExportOptions extends ExportOptions {
  readonly rootId?: ShapeId | undefined;
  readonly deviceType?: DeviceType | undefined;
  readonly includeAiDirectives?: boolean | undefined;
  readonly includeLegend?: boolean | undefined;
  readonly includeAsciiSketch?: boolean | undefined;
}

export interface JsonExportOptions extends ExportOptions {
  readonly rootId?: ShapeId | undefined;
  readonly includeAiDirectives?: boolean | undefined;
}
