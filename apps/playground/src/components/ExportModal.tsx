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
}

const FORMAT_OPTIONS = [
  { id: "markdown", label: "Markdown (.md)" },
  { id: "json", label: "JSON (.json)" },
] as const;

function ExportModalDialog(props: Omit<ExportModalProps, "isOpen">): React.JSX.Element {
  const { onClose, doc, initialFormat = "markdown" } = props;
  const [format, setFormat] = useState<"markdown" | "json">(initialFormat);
  const [creativityLevel, setCreativityLevel] = useState<CreativityLevel>(DEFAULT_CREATIVITY_LEVEL);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = preview;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (format === "markdown") {
      exportDocumentMarkdown(doc, creativityLevel);
    } else {
      exportDocumentJson(doc, creativityLevel);
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
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-6)" }}>
            <span className="od-section-header">Export Format</span>
            <OdSegmentedControl
              items={FORMAT_OPTIONS}
              value={format}
              aria-label="Export format"
              onSelect={(val) => setFormat(val as "markdown" | "json")}
            />
          </div>

          {/* Creativity Meter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-6)" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
            >
              <span className="od-section-header">AI Creativity Meter</span>
              <span className="od-meta">Defines AI implementation freedom</span>
            </div>

            {/* 5-Level Buttons */}
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "var(--od-6)" }}
            >
              {([1, 2, 3, 4, 5] as const).map((level) => {
                const def = CREATIVITY_LEVEL_DEFINITIONS[level];
                const isActive = creativityLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setCreativityLevel(level)}
                    className="od-btn"
                    style={{
                      height: "36px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                      padding: "var(--od-4)",
                      backgroundColor: isActive ? "var(--od-accent)" : "var(--od-surface)",
                      color: isActive ? "var(--od-text-on-accent)" : "var(--od-text)",
                      borderColor: isActive ? "var(--od-accent)" : "var(--od-border)",
                      fontWeight: isActive ? 600 : 500,
                    }}
                  >
                    <span style={{ fontSize: "11px", lineHeight: 1 }}>Level {level}</span>
                    <span style={{ fontSize: "9px", opacity: 0.85, lineHeight: 1 }}>
                      {def.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Level Description Card */}
            <div
              style={{
                backgroundColor: "var(--od-bg)",
                border: "var(--od-border-width) solid var(--od-border)",
                borderRadius: "var(--od-radius-sm)",
                padding: "var(--od-8) var(--od-12)",
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
                  lineHeight: 1.4,
                }}
              >
                {currentDef.description}
              </p>
            </div>
          </div>

          {/* Preview Area */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-6)" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
            >
              <span className="od-section-header">Live Output Preview</span>
              <span className="od-meta">
                {charCount} chars • {lineCount} lines
              </span>
            </div>
            <pre className="od-code-preview">
              <code>{preview}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="od-modal__footer">
          <span className="od-meta">
            Ready for AI handoff ({format === "markdown" ? "Markdown" : "JSON"})
          </span>
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
  return (
    <ExportModalDialog
      onClose={props.onClose}
      doc={props.doc}
      initialFormat={props.initialFormat ?? "markdown"}
    />
  );
}
