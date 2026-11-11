import React from "react";
import { ROOT_ROLES } from "@open-draw/contracts";
import { childrenOf, type Document, type Shape } from "@open-draw/document";
import { PLATFORM_PROFILES } from "@open-draw/profiles";
import { resolveRootPlatform, resolveShapeDisplayName } from "@open-draw/semantics";
import { OdButton, OdIcon, OdSegmentedControl } from "@open-draw/ui";
import type { ExportFormat } from "./export-modal-helpers";

const FORMAT_OPTIONS = [
  { id: "markdown", label: "Markdown (.md)" },
  { id: "json", label: "JSON (.json)" },
  { id: "svg", label: "SVG (.svg)" },
  { id: "png", label: "PNG (.png)" },
] as const;

const LEGEND_LABEL_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--od-4)",
  cursor: "pointer",
  fontSize: "var(--od-text-xs)",
  color: "var(--od-text-secondary)",
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

const ERROR_PREVIEW_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--od-8)",
  padding: "var(--od-16)",
  backgroundColor: "var(--od-bg)",
  border: "var(--od-border-width) solid var(--od-border)",
  borderRadius: "var(--od-radius-sm)",
  color: "var(--od-danger, #ef4444)",
  fontSize: "var(--od-text-sm)",
};

export interface ExportScopeSelectorProps {
  readonly rootShapes: readonly Shape[];
  readonly doc: Document;
  readonly selectedScope: string;
  readonly onSelectScope: (scope: string) => void;
}

export function ExportScopeSelector(props: ExportScopeSelectorProps): React.JSX.Element | null {
  const { rootShapes, doc, selectedScope, onSelectScope } = props;
  if (rootShapes.length <= 1) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-4)" }}>
      <span className="od-section-header">Export Scope</span>
      <select
        className="od-select"
        style={{ width: "100%" }}
        value={selectedScope}
        onChange={(e) => onSelectScope(e.target.value)}
        aria-label="Export scope"
      >
        <option value="all">Entire Canvas (All Screens &amp; Platforms)</option>
        {rootShapes.map((r) => {
          const plat = resolveRootPlatform(doc, r.id);
          const prof = plat !== undefined ? PLATFORM_PROFILES[plat] : undefined;
          const title = resolveShapeDisplayName(r, prof);
          const isProject = r.meta.role === ROOT_ROLES.project;
          const childScreens = isProject ? childrenOf(doc, r.id) : [];

          return (
            <React.Fragment key={r.id}>
              <option value={r.id}>
                {`${isProject ? `[Project Space] ${title}` : title} (${plat ?? "Generic"})`}
              </option>
              {childScreens.map((cs) => {
                const childTitle = resolveShapeDisplayName(cs, prof);
                return (
                  <option key={cs.id} value={cs.id}>
                    {`↳ ${childTitle} (Screen inside ${title})`}
                  </option>
                );
              })}
            </React.Fragment>
          );
        })}
      </select>
    </div>
  );
}

export interface ExportFormatOptionsProps {
  readonly format: ExportFormat;
  readonly onSelectFormat: (val: ExportFormat) => void;
  readonly effectiveIncludeLegend: boolean;
  readonly onToggleLegend: (val: boolean) => void;
  readonly includeAsciiSketch: boolean | undefined;
  readonly onToggleAsciiSketch: (val: boolean) => void;
  readonly shapeCount: number;
  readonly includeAnnotations: boolean;
  readonly onToggleAnnotations: (val: boolean) => void;
}

export function ExportFormatOptions(props: ExportFormatOptionsProps): React.JSX.Element {
  const {
    format,
    onSelectFormat,
    effectiveIncludeLegend,
    onToggleLegend,
    includeAsciiSketch,
    onToggleAsciiSketch,
    shapeCount,
    includeAnnotations,
    onToggleAnnotations,
  } = props;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-8)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="od-section-header">Export Format</span>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--od-12)" }}>
          {format !== "json" && (
            <label style={LEGEND_LABEL_STYLE}>
              <input
                type="checkbox"
                checked={effectiveIncludeLegend}
                onChange={(e) => onToggleLegend(e.target.checked)}
              />
              <span>Include Legend</span>
            </label>
          )}
          {format === "markdown" && (
            <label style={LEGEND_LABEL_STYLE}>
              <input
                type="checkbox"
                checked={includeAsciiSketch ?? shapeCount > 5}
                onChange={(e) => onToggleAsciiSketch(e.target.checked)}
              />
              <span>Include ASCII Sketch</span>
            </label>
          )}
          {(format === "svg" || format === "png") && (
            <label style={LEGEND_LABEL_STYLE}>
              <input
                type="checkbox"
                checked={includeAnnotations}
                onChange={(e) => onToggleAnnotations(e.target.checked)}
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
        onSelect={(val) => onSelectFormat(val as ExportFormat)}
      />
    </div>
  );
}

export interface ExportPreviewPaneProps {
  readonly format: ExportFormat;
  readonly showPreview: boolean;
  readonly onTogglePreview: () => void;
  readonly previewResult:
    | { readonly ok: true; readonly text: string }
    | { readonly ok: false; readonly error: string }
    | null;
  readonly preview: string;
  readonly svgDataUrl: string;
  readonly targetRootName: string;
  readonly targetPlatformName: string;
}

export function ExportPreviewPane(props: ExportPreviewPaneProps): React.JSX.Element {
  const {
    format,
    showPreview,
    onTogglePreview,
    previewResult,
    preview,
    svgDataUrl,
    targetRootName,
    targetPlatformName,
  } = props;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-8)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="od-section-header">
          {format === "png" ? "Visual Preview" : "Code Preview"}
        </span>
        {format !== "png" && (
          <OdButton
            variant="ghost"
            style={{
              height: "24px",
              fontSize: "var(--od-text-xs)",
              padding: "0 var(--od-8)",
            }}
            onClick={onTogglePreview}
          >
            <OdIcon name={showPreview ? "chevron" : "open"} size={14} />
            <span>{showPreview ? "Hide Preview" : "Preview Output"}</span>
          </OdButton>
        )}
      </div>

      {!showPreview && format !== "png" ? (
        <div
          style={{
            padding: "var(--od-12)",
            backgroundColor: "var(--od-bg)",
            border: "var(--od-border-width) solid var(--od-border)",
            borderRadius: "var(--od-radius-sm)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-2)" }}>
            <span style={{ fontSize: "var(--od-text-sm)", fontWeight: 500 }}>{targetRootName}</span>
            <span className="od-meta">
              Platform: {targetPlatformName} • JIT on-demand generation
            </span>
          </div>
          <OdButton variant="ghost" style={{ height: "26px" }} onClick={onTogglePreview}>
            Preview Output
          </OdButton>
        </div>
      ) : previewResult && !previewResult.ok ? (
        <div style={ERROR_PREVIEW_STYLE}>
          <span>Export preview unavailable:</span>
          <code>{previewResult.error}</code>
        </div>
      ) : format === "png" ? (
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
  );
}
