import React, { useEffect, useMemo, useState } from "react";
import type { Document } from "@open-draw/document";
import {
  type CreativityLevel,
  CREATIVITY_LEVEL_DEFINITIONS,
  DEFAULT_CREATIVITY_LEVEL,
} from "@open-draw/contracts";
import { OdButton, OdIcon, OdIconButton, OdSegmentedControl } from "@open-draw/ui";
import {
  exportDocumentJson,
  exportDocumentMarkdown,
  generateExportJson,
  generateExportMarkdown,
} from "../document-io";

export interface ExportModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly doc: Document;
  readonly initialFormat?: "markdown" | "json" | undefined;
  readonly includeLegend?: boolean;
  readonly setIncludeLegend?: (include: boolean) => void;
}

const FORMAT_OPTIONS = [
  { id: "markdown", label: "Markdown (.md)" },
  { id: "json", label: "JSON (.json)" },
] as const;

function ExportModalDialog(props: ExportModalProps): React.JSX.Element {
  const {
    onClose,
    doc,
    initialFormat = "markdown",
    includeLegend = true,
    setIncludeLegend,
  } = props;
  const [format, setFormat] = useState<"markdown" | "json">(initialFormat);
  const [creativityLevel, setCreativityLevel] = useState<CreativityLevel>(DEFAULT_CREATIVITY_LEVEL);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const preview = useMemo(() => {
    return format === "markdown"
      ? generateExportMarkdown(doc, creativityLevel)
      : generateExportJson(doc, creativityLevel);
  }, [doc, format, creativityLevel]);

  const currentDef = CREATIVITY_LEVEL_DEFINITIONS[creativityLevel];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(preview);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = preview;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (format === "markdown") exportDocumentMarkdown(doc, creativityLevel);
    else exportDocumentJson(doc, creativityLevel);
  };
  const handleMeterKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setCreativityLevel((prev) => Math.max(1, prev - 1) as CreativityLevel);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      setCreativityLevel((prev) => Math.min(5, prev + 1) as CreativityLevel);
    }
  };

  const lineCount = preview.split("\n").length;
  const charCount = preview.length;

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
        {/* Header */}
        <div className="od-modal__header">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--od-8)" }}>
            <h2 id="od-export-modal-title" className="od-panel-title">
              Export Wireframe
            </h2>
          </div>
          <OdIconButton name="close" aria-label="Close export modal" ghost onClick={onClose} />
        </div>

        {/* Body */}
        <div className="od-modal__body">
          {/* Format Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-8)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="od-section-header">Export Format</span>
              {setIncludeLegend && (
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--od-4)",
                    cursor: "pointer",
                    fontSize: "var(--od-text-xs)",
                    color: "var(--od-text-secondary)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={includeLegend}
                    onChange={(e) => setIncludeLegend(e.target.checked)}
                  />
                  <span>Include Legend</span>
                </label>
              )}
            </div>
            <OdSegmentedControl
              items={FORMAT_OPTIONS}
              value={format}
              aria-label="Export format"
              onSelect={(val) => setFormat(val as "markdown" | "json")}
            />
          </div>

          {/* Creativity Meter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-8)" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
            >
              <span className="od-section-header">AI Creativity Meter</span>
              <span className="od-meta">Defines AI implementation freedom</span>
            </div>

            {/* Contiguous Pill Meter */}
            <div
              className="od-meter-track"
              role="radiogroup"
              aria-label="AI Creativity Level"
              onKeyDown={handleMeterKeyDown}
            >
              {([1, 2, 3, 4, 5] as const).map((level) => {
                const def = CREATIVITY_LEVEL_DEFINITIONS[level];
                const isActive = creativityLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setCreativityLevel(level)}
                    className={`od-meter-segment${isActive ? " od-meter-segment--active" : ""}`}
                    aria-label={`Level ${level} ${def.name}: ${def.description}`}
                  >
                    <span className="od-meter-segment__title">{def.name}</span>
                    <span className="od-meter-segment__level">Level {level}</span>
                  </button>
                );
              })}
            </div>

            {/* Indicator Pointer Row */}
            <div className="od-meter-pointer-row" aria-hidden="true">
              {([1, 2, 3, 4, 5] as const).map((level) => (
                <div key={level} className="od-meter-pointer-col">
                  {creativityLevel === level && <div className="od-meter-pointer-arrow" />}
                </div>
              ))}
            </div>

            {/* Level Description Card */}
            <div
              style={{
                backgroundColor: "var(--od-bg)",
                border: "var(--od-border-width) solid var(--od-border)",
                borderRadius: "var(--od-radius-sm)",
                padding: "var(--od-12) var(--od-16)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--od-4)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--od-8)" }}>
                <span
                  style={{
                    fontSize: "var(--od-text-xs)",
                    fontWeight: 600,
                    color: "var(--od-text)",
                  }}
                >
                  Level {currentDef.level} — {currentDef.name}
                  {currentDef.level === DEFAULT_CREATIVITY_LEVEL ? " (Default)" : ""}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--od-text-xs)",
                  color: "var(--od-text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                {currentDef.description}
              </p>
            </div>
          </div>

          {/* Preview Area */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-8)" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
            >
              <span className="od-section-header">Live Output Preview</span>
              <span className="od-meta">
                {charCount} chars • {lineCount} lines
              </span>
            </div>
            <pre
              className="od-code-preview"
              tabIndex={0}
              role="region"
              aria-label="Live export output preview"
            >
              <code>{preview}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="od-modal__footer">
          <span className="od-meta">
            Ready for AI handoff ({format === "markdown" ? "Markdown" : "JSON"})
          </span>
          <div
            aria-live="polite"
            style={{
              position: "absolute",
              width: "1px",
              height: "1px",
              padding: 0,
              margin: "-1px",
              overflow: "hidden",
              clip: "rect(0, 0, 0, 0)",
              whiteSpace: "nowrap",
              border: 0,
            }}
          >
            {copied ? "Copied output to clipboard" : ""}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--od-8)" }}>
            <OdButton variant="ghost" onClick={handleCopy}>
              <OdIcon name={copied ? "check" : "copy"} size={16} />
              <span>{copied ? "Copied!" : "Copy"}</span>
            </OdButton>
            <OdButton variant="primary" onClick={handleDownload}>
              <OdIcon name="export" size={16} />
              <span>Download {format === "markdown" ? ".md" : ".json"}</span>
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
