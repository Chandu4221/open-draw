import type { DeviceType, ShapeId } from "@open-draw/canvas";
import type { ExportOptions } from "./export-contract";

export interface MarkdownExportOptions extends ExportOptions {
  readonly rootId?: ShapeId | undefined;
  readonly deviceType?: DeviceType | undefined;
  readonly includeAiDirectives?: boolean | undefined;
  readonly includeLegend?: boolean | undefined;
  readonly includeAsciiSketch?: boolean | undefined;
}

export interface JsonExportOptions extends ExportOptions {
  readonly rootId?: ShapeId | undefined;
  readonly deviceType?: DeviceType | undefined;
  readonly includeAiDirectives?: boolean | undefined;
}
