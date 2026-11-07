// Types and options for structured Markdown export (ADR-0005 D1, D2).
import type { DeviceType, ExportOptions, ShapeId } from "@open-draw/contracts";

export interface MarkdownExportOptions extends ExportOptions {
  readonly rootId?: ShapeId;
  readonly deviceType?: DeviceType;
  readonly includeAiDirectives?: boolean;
}

export interface JsonExportOptions extends ExportOptions {
  readonly rootId?: ShapeId;
  readonly includeAiDirectives?: boolean;
}
