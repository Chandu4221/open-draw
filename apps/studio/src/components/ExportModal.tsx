import React, { useEffect, useMemo, useState } from "react";
import { isRootId, type ShapeId } from "@open-draw/canvas";
import { type CreativityLevel, DEFAULT_CREATIVITY_LEVEL } from "@open-draw/export-markdown";
import { ancestorsOf, type Document } from "@open-draw/canvas";
import { PLATFORM_PROFILES } from "@open-draw/profiles";
import { resolveRootPlatform, resolveShapeDisplayName } from "@open-draw/semantics";
import { OdButton, OdIcon, OdIconButton } from "@open-draw/ui";
import {
  copyDocumentPng,
  exportDocumentJson,
  exportDocumentMarkdown,
  exportDocumentPng,
  exportDocumentSvg,
  generateExportJson,
  generateExportMarkdown,
  generateExportSvg,
} from "../document-io";
import { AiCreativityMeter } from "./AiCreativityMeter";

export type { ExportFormat } from "./export-modal-helpers";

export interface ExportModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly doc: Document;
  readonly initialFormat?: ExportFormat | undefined;
  readonly includeLegend?: boolean;
  readonly setIncludeLegend?: (include: boolean) => void;
  readonly selectedShapeId?: ShapeId | null | undefined;
  readonly initialShowPreview?: boolean | undefined;
}

import { ExportFormatOptions, ExportPreviewPane, ExportScopeSelector } from "./ExportPreviewPane";
import { HIDDEN_STYLE, fallbackCopyText, type ExportFormat } from "./export-modal-helpers";

function ExportModalDialog(props: ExportModalProps): React.JSX.Element {
  const {
    onClose,
    doc,
    initialFormat = "markdown",
    includeLegend = false,
    setIncludeLegend,
    selectedShapeId,
    initialShowPreview = false,
  } = props;
  const [localIncludeLegend, setLocalIncludeLegend] = useState<boolean>(includeLegend);
  const effectiveIncludeLegend =
    setIncludeLegend !== undefined ? includeLegend : localIncludeLegend;
  const handleToggleLegend = (val: boolean) => {
    if (setIncludeLegend) setIncludeLegend(val);
    else setLocalIncludeLegend(val);
  };

  const [format, setFormat] = useState<ExportFormat>(initialFormat);
  const [creativityLevel, setCreativityLevel] = useState<CreativityLevel>(DEFAULT_CREATIVITY_LEVEL);
  const [copied, setCopied] = useState<boolean>(false);
  const [includeAsciiSketch, setIncludeAsciiSketch] = useState<boolean | undefined>(undefined);
  const [includeAnnotations, setIncludeAnnotations] = useState<boolean>(true);
  const [showPreview, setShowPreview] = useState<boolean>(initialShowPreview);

  const rootShapes = useMemo(
    () => Object.values(doc.shapes).filter((s) => isRootId(s.parentId)),
    [doc.shapes],
  );

  const initialScope = useMemo(() => {
    if (!selectedShapeId) return "all";
    const selected = doc.shapes[selectedShapeId];
    if (!selected) return "all";
    if (isRootId(selected.parentId)) return selected.id;
    const anc = ancestorsOf(doc, selected);
    const root = anc.find((s) => isRootId(s.parentId));
    return root ? root.id : "all";
  }, [doc, selectedShapeId]);

  const [selectedScope, setSelectedScope] = useState<string>(initialScope);
  const targetRootId = selectedScope === "all" ? undefined : (selectedScope as ShapeId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const mdOptions = useMemo(
    () => ({
      creativityLevel,
      includeLegend: effectiveIncludeLegend,
      includeAsciiSketch,
      rootId: targetRootId,
    }),
    [creativityLevel, effectiveIncludeLegend, includeAsciiSketch, targetRootId],
  );
  const svgOptions = useMemo(
    () => ({ includeLegend: effectiveIncludeLegend, includeAnnotations, rootId: targetRootId }),
    [effectiveIncludeLegend, includeAnnotations, targetRootId],
  );

  // JIT preview: Only executed when showPreview is active or format is png
  const previewResult = useMemo<
    | { readonly ok: true; readonly text: string }
    | { readonly ok: false; readonly error: string }
    | null
  >(() => {
    if (!showPreview && format !== "png") return null;
    try {
      if (format === "markdown") return { ok: true, text: generateExportMarkdown(doc, mdOptions) };
      if (format === "json")
        return { ok: true, text: generateExportJson(doc, creativityLevel, targetRootId) };
      return { ok: true, text: generateExportSvg(doc, svgOptions) };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }, [doc, format, creativityLevel, mdOptions, svgOptions, showPreview, targetRootId]);

  const preview = previewResult?.ok ? previewResult.text : "";
  const svgDataUrl = useMemo(
    () =>
      format === "png" && previewResult?.ok
        ? `data:image/svg+xml;utf8,${encodeURIComponent(preview)}`
        : "",
    [format, preview, previewResult],
  );

  const getOutputText = (): string => {
    if (previewResult?.ok) return previewResult.text;
    if (format === "markdown") return generateExportMarkdown(doc, mdOptions);
    if (format === "json") return generateExportJson(doc, creativityLevel, targetRootId);
    return generateExportSvg(doc, svgOptions);
  };

  const handleCopy = async () => {
    try {
      if (format === "png") {
        await copyDocumentPng(doc, svgOptions);
      } else {
        const text = getOutputText();
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (format !== "png") {
        fallbackCopyText(getOutputText());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const targetRoot = targetRootId ? doc.shapes[targetRootId] : undefined;
  const targetPlatform = targetRootId ? resolveRootPlatform(doc, targetRootId) : undefined;
  const targetProfile = targetPlatform ? PLATFORM_PROFILES[targetPlatform] : undefined;
  const targetTitle = targetRoot ? resolveShapeDisplayName(targetRoot, targetProfile) : undefined;
  const baseSlug = targetTitle
    ? targetTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "export"
    : undefined;

  const handleDownload = () => {
    try {
      const filename = baseSlug ? `${baseSlug}.${format}` : undefined;
      if (format === "markdown") exportDocumentMarkdown(doc, { ...mdOptions, filename });
      else if (format === "json")
        exportDocumentJson(doc, { creativityLevel, rootId: targetRootId, filename });
      else if (format === "svg") exportDocumentSvg(doc, { ...svgOptions, filename });
      else exportDocumentPng(doc, { ...svgOptions, filename });
    } catch {
      // Export failure handled gracefully
    }
  };

  return (
    <div
      className="od-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="od-export-modal-title"
    >
      <div className="od-modal">
        <div className="od-modal__header">
          <h2 id="od-export-modal-title" className="od-panel-title">
            Export Wireframe
          </h2>
          <OdIconButton name="close" aria-label="Close export modal" ghost onClick={onClose} />
        </div>

        <div className="od-modal__body">
          {/* Scope Selector (prevents mixing platforms) */}
          <ExportScopeSelector
            rootShapes={rootShapes}
            doc={doc}
            selectedScope={selectedScope}
            onSelectScope={setSelectedScope}
          />

          {/* Format Selector */}
          <ExportFormatOptions
            format={format}
            onSelectFormat={setFormat}
            effectiveIncludeLegend={effectiveIncludeLegend}
            onToggleLegend={handleToggleLegend}
            includeAsciiSketch={includeAsciiSketch}
            onToggleAsciiSketch={setIncludeAsciiSketch}
            shapeCount={Object.keys(doc.shapes).length}
            includeAnnotations={includeAnnotations}
            onToggleAnnotations={setIncludeAnnotations}
          />

          {(format === "markdown" || format === "json") && (
            <AiCreativityMeter
              creativityLevel={creativityLevel}
              setCreativityLevel={setCreativityLevel}
            />
          )}

          {/* JIT Output & Preview Pane */}
          <ExportPreviewPane
            format={format}
            showPreview={showPreview}
            onTogglePreview={() => setShowPreview((prev) => !prev)}
            previewResult={previewResult}
            preview={preview}
            svgDataUrl={svgDataUrl}
            targetRootName={
              targetRoot
                ? resolveShapeDisplayName(
                    targetRoot,
                    targetPlatform !== undefined ? PLATFORM_PROFILES[targetPlatform] : undefined,
                  )
                : "Entire Canvas"
            }
            targetPlatformName={targetPlatform ?? "All Platforms"}
          />
        </div>

        <div className="od-modal__footer">
          <span className="od-meta">
            {targetPlatform ? `Scoped to ${targetPlatform}` : "Entire Workspace"}
          </span>
          <div aria-live="polite" style={HIDDEN_STYLE}>
            {copied ? "Copied output to clipboard" : ""}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--od-8)" }}>
            <OdButton variant="ghost" onClick={handleCopy}>
              <OdIcon name={copied ? "check" : "copy"} size={16} />
              <span>{copied ? "Copied!" : format === "png" ? "Copy Image" : "Copy"}</span>
            </OdButton>
            <OdButton variant="primary" onClick={handleDownload}>
              <OdIcon name="export" size={16} />
              <span>Download .{format}</span>
            </OdButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExportModal(props: ExportModalProps): React.JSX.Element | null {
  if (!props.isOpen) return null;
  return <ExportModalDialog {...props} initialFormat={props.initialFormat ?? "markdown"} />;
}
