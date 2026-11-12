import {
  parseDocument,
  serializeDocument,
  subtreeOf,
  type Document,
  type Shape,
} from "@open-draw/document";
import { exportJson, exportMarkdown } from "@open-draw/export-markdown";
import { documentToSvgWithLegend, type LegendItem } from "@open-draw/renderer-svg";
import { PLATFORM_PROFILES } from "@open-draw/profiles";
import { resolveRootPlatform, resolveShapeDisplayName } from "@open-draw/semantics";
import {
  isRootId,
  type CreativityLevel,
  type ShapeId,
  DEFAULT_CREATIVITY_LEVEL,
} from "@open-draw/contracts";

export interface SvgExportOptions {
  readonly includeLegend?: boolean | undefined;
  readonly includeAnnotations?: boolean | undefined;
  readonly rootId?: ShapeId | undefined;
}

export interface MarkdownExportIoOptions {
  readonly creativityLevel?: CreativityLevel | undefined;
  readonly includeLegend?: boolean | undefined;
  readonly includeAsciiSketch?: boolean | undefined;
  readonly rootId?: ShapeId | undefined;
}

export function extractDocumentLegendItems(doc: Document): readonly LegendItem[] {
  const seen = new Set<string>();
  const items: LegendItem[] = [];
  for (const shape of Object.values(doc.shapes)) {
    if (shape.meta.semantic !== undefined) {
      const tag = shape.meta.semantic.id;
      if (!seen.has(tag)) {
        seen.add(tag);
        const rootPlatform = resolveRootPlatform(doc, shape.id);
        const profile = rootPlatform !== undefined ? PLATFORM_PROFILES[rootPlatform] : undefined;
        const label = resolveShapeDisplayName(shape, profile);
        items.push({ tag, label });
      }
    }
  }
  return items;
}

export function generateExportSvg(doc: Document, options?: SvgExportOptions | boolean): string {
  const includeLegend = typeof options === "boolean" ? options : (options?.includeLegend ?? false);
  const includeAnnotations =
    typeof options === "boolean" ? true : (options?.includeAnnotations ?? true);
  const rootId = typeof options === "object" ? options.rootId : undefined;

  const resolveDisplayName = (shape: Shape): string => {
    const rootPlatform = resolveRootPlatform(doc, shape.id);
    const profile = rootPlatform !== undefined ? PLATFORM_PROFILES[rootPlatform] : undefined;
    return resolveShapeDisplayName(shape, profile);
  };

  const visibleShapeIds =
    rootId !== undefined && !isRootId(rootId)
      ? new Set(subtreeOf(doc, rootId).map((s) => s.id))
      : undefined;

  return documentToSvgWithLegend(doc, {
    includeLegend,
    includeAnnotations,
    resolveDisplayName,
    ...(visibleShapeIds !== undefined ? { visibleShapeIds } : {}),
  });
}

function safeRevokeUrl(url: string): void {
  const isTest =
    (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === "test";
  if (typeof window !== "undefined" && typeof window.setTimeout === "function" && !isTest) {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else {
    URL.revokeObjectURL(url);
  }
}

export function exportDocumentSvg(doc: Document, options?: SvgExportOptions | boolean): void {
  const svg = generateExportSvg(doc, options);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "opendraw-diagram.svg";
  a.click();
  safeRevokeUrl(url);
}

export function exportDocumentPng(
  doc: Document,
  options?: SvgExportOptions | boolean,
  onError?: (err: unknown) => void,
): void {
  const svg = generateExportSvg(doc, options);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    try {
      const scale = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const baseWidth = img.naturalWidth || img.width;
      const baseHeight = img.naturalHeight || img.height;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(baseWidth * scale);
      canvas.height = Math.round(baseHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Unable to create canvas 2D context");
      }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      safeRevokeUrl(url);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) {
          onError?.(new Error("Unable to generate PNG blob from canvas"));
          return;
        }
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = "opendraw-diagram.png";
        a.click();
        safeRevokeUrl(pngUrl);
      }, "image/png");
    } catch (err) {
      safeRevokeUrl(url);
      onError?.(err);
    }
  };
  img.onerror = (err) => {
    safeRevokeUrl(url);
    onError?.(err);
  };
  img.src = url;
}

export async function copyDocumentPng(
  doc: Document,
  options?: SvgExportOptions | boolean,
): Promise<void> {
  const svg = generateExportSvg(doc, options);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        const baseWidth = img.naturalWidth || img.width;
        const baseHeight = img.naturalHeight || img.height;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(baseWidth * scale);
        canvas.height = Math.round(baseHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          safeRevokeUrl(url);
          reject(new Error("Unable to create canvas 2D context"));
          return;
        }
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        safeRevokeUrl(url);
        canvas.toBlob(async (pngBlob) => {
          if (!pngBlob) {
            reject(new Error("Unable to generate PNG blob"));
            return;
          }
          try {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
            resolve();
          } catch (err) {
            reject(err);
          }
        }, "image/png");
      } catch (err) {
        safeRevokeUrl(url);
        reject(err);
      }
    };
    img.onerror = (err) => {
      safeRevokeUrl(url);
      reject(err);
    };
    img.src = url;
  });
}

export function generateExportJson(
  doc: Document,
  creativityLevel: CreativityLevel = DEFAULT_CREATIVITY_LEVEL,
  rootId?: ShapeId | undefined,
): string {
  return exportJson(doc, {
    creativityLevel,
    ...(rootId !== undefined && !isRootId(rootId) ? { rootId } : {}),
  });
}

export function generateExportMarkdown(
  doc: Document,
  options?: MarkdownExportIoOptions | CreativityLevel,
): string {
  const creativityLevel =
    typeof options === "number" ? options : (options?.creativityLevel ?? DEFAULT_CREATIVITY_LEVEL);
  const includeLegend = typeof options === "object" ? options.includeLegend : false;
  const includeAsciiSketch = typeof options === "object" ? options.includeAsciiSketch : undefined;
  const rootId = typeof options === "object" ? options.rootId : undefined;

  return exportMarkdown(doc, {
    creativityLevel,
    includeLegend,
    includeAsciiSketch,
    ...(rootId !== undefined && !isRootId(rootId) ? { rootId } : {}),
  });
}

export function generateSaveDocumentJson(doc: Document): string {
  return serializeDocument(doc);
}

export function saveDocumentJson(doc: Document): void {
  const json = generateSaveDocumentJson(doc);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "opendraw-document.json";
  a.click();
  safeRevokeUrl(url);
}

export function exportDocumentJson(
  doc: Document,
  creativityLevel?: CreativityLevel,
  rootId?: ShapeId | undefined,
): void {
  const json = generateExportJson(doc, creativityLevel, rootId);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "opendraw-document.json";
  a.click();
  safeRevokeUrl(url);
}

export function exportDocumentMarkdown(
  doc: Document,
  options?: MarkdownExportIoOptions | CreativityLevel,
): void {
  const md = generateExportMarkdown(doc, options);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "opendraw-document.md";
  a.click();
  safeRevokeUrl(url);
}

export const MAX_LOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function promptLoadDocumentJson(
  onLoaded: (doc: Document) => void,
  onError: (err: unknown) => void,
): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > MAX_LOAD_FILE_SIZE_BYTES) {
        throw new Error(
          `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit (10 MB)`,
        );
      }
      const text = await file.text();
      const loaded = parseDocument(text);
      onLoaded(loaded);
    } catch (err) {
      onError(err);
    } finally {
      input.value = "";
    }
  };
  input.click();
}
