import React, { useEffect, useMemo, useState } from "react";
import type { Document } from "@open-draw/document";
import { type CreativityLevel, DEFAULT_CREATIVITY_LEVEL } from "@open-draw/contracts";
import { OdButton, OdIcon, OdIconButton, OdSegmentedControl } from "@open-draw/ui";
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

export type ExportFormat = "markdown" | "json" | "svg" | "png";

export interface ExportModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly doc: Document;
  readonly initialFormat?: ExportFormat | undefined;
  readonly includeLegend?: boolean;
  readonly setIncludeLegend?: (include: boolean) => void;
}

const FORMAT_OPTIONS = [
  { id: "markdown", label: "Markdown (.md)" },
  { id: "json", label: "JSON (.json)" },
  { id: "svg", label: "SVG (.svg)" },
  { id: "png", label: "PNG (.png)" },
] as const;

const HIDDEN_STYLE: React.CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const PNG_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "var(--od-bg)",
  border: "var(--od-border-width) solid var(--od-border)",
  borderRadius: "var(--od-radius-sm)",
  padding: "var(--od-16)",
  maxHeight: "260px",
  overflow: "auto",
};

const LEGEND_LABEL_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--od-4)",
  cursor: "pointer",
  fontSize: "var(--od-text-xs)",
  color: "var(--od-text-secondary)",
};

function ExportModalDialog(props: ExportModalProps): React.JSX.Element {
  const {
    onClose,
    doc,
    initialFormat = "markdown",
    includeLegend = false,
    setIncludeLegend,
  } = props;
  const [localIncludeLegend, setLocalIncludeLegend] = useState<boolean>(includeLegend);
  const effectiveIncludeLegend =
    setIncludeLegend !== undefined ? includeLegend : localIncludeLegend;
  const handleToggleLegend = (val: boolean) => {
    if (setIncludeLegend) {
      setIncludeLegend(val);
    } else {
      setLocalIncludeLegend(val);
    }
  };

  const [format, setFormat] = useState<ExportFormat>(initialFormat);
  const [creativityLevel, setCreativityLevel] = useState<CreativityLevel>(DEFAULT_CREATIVITY_LEVEL);
  const [copied, setCopied] = useState<boolean>(false);
  const [includeAsciiSketch, setIncludeAsciiSketch] = useState<boolean | undefined>(undefined);
  const [includeAnnotations, setIncludeAnnotations] = useState<boolean>(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const mdOptions = useMemo(
    () => ({ creativityLevel, includeLegend: effectiveIncludeLegend, includeAsciiSketch }),
    [creativityLevel, effectiveIncludeLegend, includeAsciiSketch],
  );
  const svgOptions = useMemo(
    () => ({ includeLegend: effectiveIncludeLegend, includeAnnotations }),
    [effectiveIncludeLegend, includeAnnotations],
  );

  const preview = useMemo(() => {
    if (format === "markdown") return generateExportMarkdown(doc, mdOptions);
    if (format === "json") return generateExportJson(doc, creativityLevel);
    return generateExportSvg(doc, svgOptions);
  }, [doc, format, creativityLevel, mdOptions, svgOptions]);

  const svgDataUrl = useMemo(
    () => (format === "png" ? `data:image/svg+xml;utf8,${encodeURIComponent(preview)}` : ""),
    [format, preview],
  );

  const handleCopy = async () => {
    try {
      if (format === "png") {
        await copyDocumentPng(doc, svgOptions);
      } else {
        await navigator.clipboard.writeText(preview);
      }
    } catch {
      if (format !== "png") {
        const ta = document.createElement("textarea");
        ta.value = preview;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (format === "markdown") exportDocumentMarkdown(doc, mdOptions);
    else if (format === "json") exportDocumentJson(doc, creativityLevel);
    else if (format === "svg") exportDocumentSvg(doc, svgOptions);
    else exportDocumentPng(doc, svgOptions);
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
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-8)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="od-section-header">Export Format</span>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--od-12)" }}>
                {format !== "json" && (
                  <label style={LEGEND_LABEL_STYLE}>
                    <input
                      type="checkbox"
                      checked={effectiveIncludeLegend}
                      onChange={(e) => handleToggleLegend(e.target.checked)}
                    />
                    <span>Include Legend</span>
                  </label>
                )}
                {format === "markdown" && (
                  <label style={LEGEND_LABEL_STYLE}>
                    <input
                      type="checkbox"
                      checked={includeAsciiSketch ?? Object.keys(doc.shapes).length > 5}
                      onChange={(e) => setIncludeAsciiSketch(e.target.checked)}
                    />
                    <span>Include ASCII Sketch</span>
                  </label>
                )}
                {(format === "svg" || format === "png") && (
                  <label style={LEGEND_LABEL_STYLE}>
                    <input
                      type="checkbox"
                      checked={includeAnnotations}
                      onChange={(e) => setIncludeAnnotations(e.target.checked)}
                    />
                    <span>Include Annotations</span>
                  </label>
                )}
              </div>
            </div>
            <OdSegmentedControl
              items={FORMAT_OPTIONS}
              value={format}
              aria-label="Export format"
              onSelect={(val) => setFormat(val as ExportFormat)}
            />
          </div>

          {(format === "markdown" || format === "json") && (
            <AiCreativityMeter
              creativityLevel={creativityLevel}
              setCreativityLevel={setCreativityLevel}
            />
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-8)" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
            >
              <span className="od-section-header">
                {format === "png" ? "Visual Preview" : "Live Output Preview"}
              </span>
              <span className="od-meta">
                {format === "png"
                  ? "Raster PNG diagram preview"
                  : `${preview.length} chars • ${preview.split("\n").length} lines`}
              </span>
            </div>
            {format === "png" ? (
              <div style={PNG_STYLE}>
                <img
                  src={svgDataUrl}
                  alt="Wireframe visual preview"
                  style={{ maxWidth: "100%", maxHeight: "220px", objectFit: "contain" }}
                />
              </div>
            ) : (
              <pre
                className="od-code-preview"
                tabIndex={0}
                role="region"
                aria-label="Live export output preview"
              >
                <code>{preview}</code>
              </pre>
            )}
          </div>
        </div>

        <div className="od-modal__footer">
          <span className="od-meta">
            {format === "markdown" || format === "json"
              ? `Ready for AI handoff (${format === "markdown" ? "Markdown" : "JSON"})`
              : `Ready for visual export (${format.toUpperCase()})`}
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
